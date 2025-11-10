# 📊 Dashboard Update Guide - From Mock Data to Real Backend

## 🎯 Overview

This guide shows you **exactly** how to replace mock data in `app/page.tsx` with real database hooks that provide **real-time synchronization** across all dashboards.

## 🔄 Migration Strategy

### Phase 1: Supplier Dashboard (Start Here)
### Phase 2: Customer Dashboard
### Phase 3: Transporter Dashboard

---

## 📝 Phase 1: Supplier Dashboard

### Current Code (Mock Data):
```typescript
// Around line 100-150 in app/page.tsx
const [shipments, setShipments] = useState([
  {
    id: "SH001",
    trackingId: "TRK001",
    origin: "Mumbai",
    destination: "Delhi",
    status: "In Transit",
    // ... more mock data
  }
]);

const [suppliers, setSuppliers] = useState([
  { id: "SUP001", name: "ElectroSource", category: "Electronics", rating: 4.8 }
  // ... more mock data
]);
```

### New Code (Real Database):
```typescript
import { useShipments, useSuppliers, useNotifications } from '@/hooks/use-database';
import { useState, useEffect } from 'react';

// Inside SupplierDashboard component (around line 2800):
const SupplierDashboard = () => {
  const [currentUser] = useState({ id: 'SUP001', role: 'supplier', name: 'ElectroSource' });
  
  // Real-time shipments for this supplier
  const { 
    shipments, 
    loading: shipmentsLoading, 
    error: shipmentsError,
    createShipment, 
    updateShipment,
    deleteShipment 
  } = useShipments({ 
    supplierId: currentUser.id 
  });

  // Real-time notifications
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead 
  } = useNotifications(currentUser.id);

  // All suppliers directory
  const { 
    suppliers, 
    loading: suppliersLoading 
  } = useSuppliers();

  // Handle loading state
  if (shipmentsLoading) {
    return <div>Loading your shipments...</div>;
  }

  // Handle errors
  if (shipmentsError) {
    return <div>Error loading data: {shipmentsError.message}</div>;
  }

  // Now shipments, suppliers, notifications are REAL and update in real-time!
  return (
    <div>
      {/* Your existing dashboard UI */}
      {/* shipments array now contains real database data */}
      {/* Updates automatically when data changes */}
    </div>
  );
};
```

### How to Create New Shipment:
```typescript
// OLD WAY (Mock):
const handleCreateShipment = () => {
  const newShipment = { id: "SH999", /* ... */ };
  setShipments([...shipments, newShipment]);
};

// NEW WAY (Real Database):
const handleCreateShipment = async () => {
  try {
    const newShipment = await createShipment({
      supplier_id: currentUser.id,
      customer_id: 'CUS001',
      origin: 'Mumbai',
      destination: 'Delhi',
      cargo_type: 'Electronics',
      weight: 1500,
      volume: 10,
      estimated_delivery: '2025-01-25',
      route: ['Mumbai', 'Pune', 'Delhi']
    });
    
    // No need to update state manually!
    // useShipments hook automatically updates the shipments array
    console.log('Created:', newShipment);
  } catch (error) {
    console.error('Failed to create shipment:', error);
  }
};
```

### How to Update Shipment Status:
```typescript
// OLD WAY (Mock):
const handleUpdateStatus = (shipmentId: string, newStatus: string) => {
  setShipments(shipments.map(s => 
    s.id === shipmentId ? { ...s, status: newStatus } : s
  ));
};

// NEW WAY (Real Database):
const handleUpdateStatus = async (shipmentId: string, newStatus: string) => {
  try {
    await updateShipment(shipmentId, { status: newStatus });
    // Status updates automatically in ALL dashboards!
    // Customer and transporter see the change instantly
  } catch (error) {
    console.error('Failed to update status:', error);
  }
};
```

---

## 📦 Phase 2: Customer Dashboard

### Import Hooks:
```typescript
import { useShipments, useSuppliers, useNotifications } from '@/hooks/use-database';
```

### Replace Mock Data (around line 5300):
```typescript
const CustomerDashboard = () => {
  const [currentUser] = useState({ id: 'CUS001', role: 'customer', name: 'TechMart' });
  
  // Real-time shipments for this customer
  const { 
    shipments, 
    loading, 
    updateShipment 
  } = useShipments({ 
    customerId: currentUser.id 
  });

  // Real-time notifications
  const { 
    notifications, 
    unreadCount, 
    markAsRead 
  } = useNotifications(currentUser.id);

  // Track specific shipment
  const trackShipment = (trackingId: string) => {
    const shipment = shipments.find(s => s.tracking_id === trackingId);
    // Real-time tracking data!
    return shipment;
  };

  return (
    <div>
      {/* Existing dashboard UI */}
      {/* shipments array updates automatically when supplier changes anything */}
    </div>
  );
};
```

---

## 🚚 Phase 3: Transporter Dashboard

### Import Hooks:
```typescript
import { useShipments, useTransporters, useNotifications } from '@/hooks/use-database';
```

### Replace Mock Data:
```typescript
const TransporterDashboard = () => {
  const [currentUser] = useState({ id: 'TRA001', role: 'transporter', name: 'Swift Logistics' });
  
  // Real-time available shipments (no transporter assigned)
  const { 
    shipments: availableShipments, 
    loading: availableLoading 
  } = useShipments({ 
    status: 'Pending',
    transporterId: null // Unassigned shipments
  });

  // Real-time assigned shipments
  const { 
    shipments: myShipments, 
    updateShipment,
    updateLocation 
  } = useShipments({ 
    transporterId: currentUser.id 
  });

  // Real-time notifications
  const { 
    notifications, 
    unreadCount 
  } = useNotifications(currentUser.id);

  // Accept shipment
  const acceptShipment = async (shipmentId: string) => {
    await updateShipment(shipmentId, {
      transporter_id: currentUser.id,
      status: 'Accepted'
    });
    // Shipment moves from availableShipments to myShipments automatically!
    // Supplier and customer get notified via Telegram!
  };

  // Update GPS location (real-time tracking)
  const updateGPSLocation = async (shipmentId: string, lat: number, lng: number) => {
    await updateLocation(shipmentId, { latitude: lat, longitude: lng });
    // All dashboards see updated location on map instantly!
  };

  return (
    <div>
      {/* Existing dashboard UI */}
      {/* Real-time data updates */}
    </div>
  );
};
```

---

## 🎨 Component Examples

### Real-Time Shipment List:
```typescript
const ShipmentList = () => {
  const { shipments, loading } = useShipments({ status: 'In Transit' });

  if (loading) return <Skeleton />;

  return (
    <div>
      {shipments.map(shipment => (
        <div key={shipment.id}>
          <h3>{shipment.tracking_id}</h3>
          <p>Status: {shipment.status}</p>
          <p>Progress: {shipment.progress}%</p>
          {/* Updates automatically when data changes! */}
        </div>
      ))}
    </div>
  );
};
```

### Real-Time Notifications:
```typescript
const NotificationBell = () => {
  const { notifications, unreadCount, markAllAsRead } = useNotifications(currentUser.id);

  return (
    <div>
      <button>
        🔔 Notifications {unreadCount > 0 && `(${unreadCount})`}
      </button>
      <div>
        {notifications.slice(0, 5).map(notif => (
          <div key={notif.id}>
            <p>{notif.message}</p>
            <small>{new Date(notif.created_at).toLocaleString()}</small>
          </div>
        ))}
      </div>
      <button onClick={markAllAsRead}>Mark all as read</button>
    </div>
  );
};
```

### Real-Time Analytics:
```typescript
const AnalyticsDashboard = () => {
  const { analytics, loading } = useAnalytics(currentUser.id, currentUser.role);

  if (loading) return <Skeleton />;

  return (
    <div>
      <StatCard title="Total Shipments" value={analytics.totalShipments} />
      <StatCard title="In Transit" value={analytics.inTransit} />
      <StatCard title="Delivered" value={analytics.delivered} />
      <StatCard title="On-Time Rate" value={`${analytics.onTimeRate}%`} />
      {/* Updates automatically! */}
    </div>
  );
};
```

---

## 🔥 Real-Time Sync Examples

### Scenario 1: Supplier Creates Shipment
```typescript
// Supplier Dashboard (Tab 1)
await createShipment({
  supplier_id: 'SUP001',
  customer_id: 'CUS001',
  cargo_type: 'Electronics',
  // ...
});

// 🎉 INSTANT EFFECTS:
// - Customer Dashboard (Tab 2) → New order appears in "Active Orders"
// - Transporter Dashboard (Tab 3) → Shows in "Available Shipments"
// - Customer's Telegram → 📱 "New shipment SH005 created!"
// - All happens in < 100ms via WebSocket!
```

### Scenario 2: Transporter Accepts Shipment
```typescript
// Transporter Dashboard
await updateShipment('SH005', {
  transporter_id: 'TRA001',
  status: 'Accepted'
});

// 🎉 INSTANT EFFECTS:
// - Supplier Dashboard → Status changes to "Accepted"
// - Customer Dashboard → Shows assigned transporter
// - Supplier's Telegram → 📱 "Shipment SH005 accepted by Swift Logistics"
// - Customer's Telegram → 📱 "Your order is being prepared for shipping"
```

### Scenario 3: Real-Time GPS Tracking
```typescript
// Transporter Dashboard (updating every 30 seconds)
await updateLocation('SH005', {
  latitude: 19.0760,
  longitude: 72.8777
});

// 🎉 INSTANT EFFECTS:
// - Supplier Dashboard → Map marker moves
// - Customer Dashboard → "Track Shipment" shows new location
// - Progress bar updates automatically
// - ETA recalculated based on current position
```

---

## ✅ Testing Checklist

After updating dashboards:

### Test 1: Real-Time Creation
- [ ] Open Supplier Dashboard in Tab 1
- [ ] Open Customer Dashboard in Tab 2
- [ ] Create shipment in Tab 1
- [ ] ✅ Should appear in Tab 2 instantly (no refresh)

### Test 2: Real-Time Updates
- [ ] Open all 3 dashboards (Supplier, Customer, Transporter)
- [ ] Update shipment status in any dashboard
- [ ] ✅ All dashboards update automatically

### Test 3: Telegram Integration
- [ ] Link Telegram in any dashboard
- [ ] Create/update shipment on website
- [ ] ✅ Telegram notification received instantly

### Test 4: Multi-Device Sync
- [ ] Open dashboard on computer
- [ ] Open same dashboard on phone
- [ ] Make change on computer
- [ ] ✅ Phone dashboard updates without refresh

### Test 5: Offline Recovery
- [ ] Disconnect internet
- [ ] Try to create shipment → Should show error
- [ ] Reconnect internet
- [ ] ✅ Dashboard reconnects automatically, shows latest data

---

## 🚨 Common Mistakes to Avoid

### ❌ DON'T: Mix mock data with real data
```typescript
// BAD - Don't do this!
const [mockShipments, setMockShipments] = useState([...]);
const { shipments: realShipments } = useShipments();
```

### ✅ DO: Use only real hooks
```typescript
// GOOD - Clean approach
const { shipments, createShipment, updateShipment } = useShipments();
```

### ❌ DON'T: Manually update state after database operation
```typescript
// BAD - Hook already does this!
await createShipment(data);
setShipments([...shipments, newShipment]); // ❌ Unnecessary!
```

### ✅ DO: Trust the hooks to update automatically
```typescript
// GOOD - Just call the function
await createShipment(data);
// shipments array updates automatically via WebSocket subscription
```

### ❌ DON'T: Forget error handling
```typescript
// BAD - No error handling
const handleCreate = () => {
  createShipment(data); // ❌ What if it fails?
};
```

### ✅ DO: Handle errors gracefully
```typescript
// GOOD - Proper error handling
const handleCreate = async () => {
  try {
    await createShipment(data);
    toast.success('Shipment created!');
  } catch (error) {
    toast.error('Failed to create shipment');
    console.error(error);
  }
};
```

---

## 🎯 Migration Order

1. **Start with Supplier Dashboard** (most features)
2. **Then Customer Dashboard** (simpler)
3. **Finally Transporter Dashboard** (test cross-dashboard sync)
4. **Test all together** (open 3 tabs, verify real-time updates)

---

## 📊 Before vs After Comparison

### Before (Mock Data):
- ❌ Data lost on page refresh
- ❌ No sync between dashboards
- ❌ Manual state management
- ❌ Can't test multi-user scenarios
- ❌ No persistence

### After (Real Backend):
- ✅ Data persisted in PostgreSQL
- ✅ Real-time sync across ALL dashboards
- ✅ Automatic state management
- ✅ Multi-user support
- ✅ Full CRUD operations
- ✅ Telegram notifications
- ✅ Production-ready scalability

---

## 🚀 Next Steps

1. **Set up Supabase** (follow `SETUP_NEXT_STEPS.md`)
2. **Update Supplier Dashboard first** (use code examples above)
3. **Test real-time sync** (open 2 tabs, verify updates)
4. **Update Customer Dashboard** (repeat process)
5. **Update Transporter Dashboard** (complete the trio)
6. **Test cross-dashboard sync** (the magic moment!)
7. **Deploy to production** (Vercel + Supabase)

---

**Time Estimate**: 
- Supplier Dashboard: ~30 minutes
- Customer Dashboard: ~20 minutes
- Transporter Dashboard: ~20 minutes
- Testing: ~10 minutes
- **Total: ~1.5 hours** → Real-time cross-dashboard sync working! 🎉
