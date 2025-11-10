"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CheckCircle2,
  Copy,
  ExternalLink,
  Loader2,
  MessageCircle,
  QrCode,
  RefreshCcw,
  Unlink,
  XCircle,
} from "lucide-react";

interface TelegramLinkProps {
  userId: string;
  userName?: string;
}

interface LinkingCodeData {
  code: string;
  expiresAt: string;
  expiresIn: number;
}

interface LinkedAccountData {
  linked: boolean;
  telegramId?: number;
  telegramUsername?: string;
  telegramFirstName?: string;
  linkedAt?: string;
  lastActive?: string;
  notifications?: boolean;
}

export function TelegramLink({ userId, userName }: TelegramLinkProps) {
  const [linkedAccount, setLinkedAccount] = useState<LinkedAccountData | null>(null);
  const [linkingCode, setLinkingCode] = useState<LinkingCodeData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  // Check if account is already linked
  useEffect(() => {
    checkLinkStatus();
  }, [userId]);

  // Countdown timer for code expiration
  useEffect(() => {
    if (!linkingCode) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const expiresAt = new Date(linkingCode.expiresAt).getTime();
      const remaining = Math.floor((expiresAt - now) / 1000);

      if (remaining <= 0) {
        setLinkingCode(null);
        setTimeRemaining(0);
      } else {
        setTimeRemaining(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [linkingCode]);

  const checkLinkStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/telegram/link?userId=${userId}`);
      const data = await response.json();
      setLinkedAccount(data);
    } catch (err) {
      console.error("Error checking link status:", err);
    } finally {
      setLoading(false);
    }
  };

  const generateLinkingCode = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/telegram/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, userName }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate code");
      }

      const data = await response.json();
      setLinkingCode(data);
      setTimeRemaining(data.expiresIn);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const unlinkAccount = async () => {
    if (!confirm("Are you sure you want to unlink your Telegram account?")) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/telegram/link?userId=${userId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to unlink account");
      }

      setLinkedAccount(null);
      setLinkingCode(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!linkingCode) return;
    
    try {
      await navigator.clipboard.writeText(linkingCode.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading && !linkedAccount && !linkingCode) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // Already linked view
  if (linkedAccount?.linked) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              <CardTitle>Telegram Connected</CardTitle>
            </div>
            <Badge variant="default" className="gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Active
            </Badge>
          </div>
          <CardDescription>
            Your Telegram account is linked and receiving notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Telegram Name:</span>
              <span className="font-medium">{linkedAccount.telegramFirstName}</span>
            </div>
            {linkedAccount.telegramUsername && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Username:</span>
                <span className="font-mono">@{linkedAccount.telegramUsername}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Linked Since:</span>
              <span className="font-medium">
                {linkedAccount.linkedAt
                  ? new Date(linkedAccount.linkedAt).toLocaleDateString()
                  : "N/A"}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Notifications:</span>
              <Badge variant={linkedAccount.notifications ? "default" : "secondary"}>
                {linkedAccount.notifications ? "Enabled" : "Disabled"}
              </Badge>
            </div>
          </div>

          <Alert>
            <AlertDescription>
              💡 Open Telegram and message{" "}
              <a
                href="https://t.me/FlexMove_bot"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium underline inline-flex items-center gap-1"
              >
                @FlexMove_bot
                <ExternalLink className="h-3 w-3" />
              </a>{" "}
              to interact with Flexify AI and receive updates.
            </AlertDescription>
          </Alert>

          <Button
            variant="outline"
            onClick={unlinkAccount}
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Unlink className="mr-2 h-4 w-4" />
            )}
            Unlink Account
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Linking flow view
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          <CardTitle>Link Telegram</CardTitle>
        </div>
        <CardDescription>
          Connect your Telegram account to receive notifications and chat with Flexify AI
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!linkingCode ? (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground space-y-2">
              <p>Benefits of linking Telegram:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Receive real-time shipment notifications</li>
                <li>Chat with Flexify AI assistant</li>
                <li>Track shipments on the go</li>
                <li>Get instant disruption alerts</li>
              </ul>
            </div>

            <Button onClick={generateLinkingCode} disabled={loading} className="w-full">
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <QrCode className="mr-2 h-4 w-4" />
              )}
              Generate Linking Code
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <Alert>
              <AlertDescription className="space-y-2">
                <p className="font-medium">Follow these steps:</p>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>Open Telegram and search for <strong>@FlexMove_bot</strong></li>
                  <li>Send the command: <code className="bg-muted px-1 rounded">/link {linkingCode.code}</code></li>
                  <li>Your account will be linked automatically</li>
                </ol>
              </AlertDescription>
            </Alert>

            <div className="rounded-lg border-2 border-dashed p-6 text-center space-y-3">
              <p className="text-sm text-muted-foreground">Your linking code:</p>
              <div className="flex items-center justify-center gap-2">
                <code className="text-3xl font-bold tracking-wider bg-muted px-4 py-2 rounded">
                  {linkingCode.code}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={copyToClipboard}
                >
                  {copied ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <div className="flex items-center justify-center gap-2 text-sm">
                <Badge variant={timeRemaining < 60 ? "destructive" : "secondary"}>
                  Expires in {formatTime(timeRemaining)}
                </Badge>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={generateLinkingCode}
                disabled={loading}
                className="flex-1"
              >
                <RefreshCcw className="mr-2 h-4 w-4" />
                New Code
              </Button>
              <Button
                variant="default"
                onClick={() => window.open("https://t.me/FlexMove_bot", "_blank")}
                className="flex-1"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Open Bot
              </Button>
            </div>

            <Button
              variant="ghost"
              onClick={checkLinkStatus}
              disabled={loading}
              size="sm"
              className="w-full"
            >
              {loading ? (
                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
              ) : (
                <RefreshCcw className="mr-2 h-3 w-3" />
              )}
              Check Link Status
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
