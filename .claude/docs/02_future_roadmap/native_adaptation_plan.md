# Native Adaptation Plan

**Agent Persona**: Mobile UX Optimizer
**Date**: January 2026
**Version**: 1.0

---

## Executive Summary

This document outlines the strategy for adapting Aura from a PWA to native iOS/Android apps. The recommended approach is **Capacitor** for initial market testing, with potential **React Native** rebuild for long-term optimization. Key considerations include App Store compliance, In-App Purchase requirements, and native UI patterns.

---

## App Store Requirements

### Apple App Store

#### Mandatory Requirements

| Requirement | Impact | Solution |
|-------------|--------|----------|
| In-App Purchase for digital goods | Cannot use web Stripe | Implement StoreKit via Capacitor plugin |
| 30% Apple commission | Pricing adjustment needed | Price tiers must account for cut |
| Privacy Nutrition Labels | Disclosure required | Document all data collection |
| App Review Guidelines | Content restrictions | Dating category compliance |
| Sign in with Apple | Required if other OAuth offered | Add Apple OAuth |

#### Dating Category Guidelines (4.3)

> Apps in the dating category must:
> - Include a method to report offensive users
> - Block users
> - Not be used for solicitation

**Implementation Required**:
- Block/report UI (even though profiles aren't real users)
- Content warning for AI-generated insights
- Clear disclaimer that app analyzes public profiles

#### Privacy Requirements

**Data Collected** (for nutrition label):
- Email (account creation)
- Photos/Videos (processed locally, frames sent to AI)
- Usage Data (analytics if implemented)
- Purchases (credit transactions)

**Data NOT Collected**:
- Location (weather feature uses user-provided city)
- Contacts
- Browsing History

### Google Play Store

#### Requirements

| Requirement | Impact | Solution |
|-------------|--------|----------|
| Google Play Billing | Required for digital goods | Implement via RevenueCat |
| 15% commission (first $1M) | Better than Apple | Same pricing works |
| Data Safety Section | Similar to Apple | Same disclosures |
| Target API Level | Must target recent Android | Capacitor handles this |

---

## Technology Decision: Capacitor vs React Native

### Option 1: Capacitor (Recommended for MVP)

**What it is**: Native container that runs web app with native API access

**Pros**:
- Reuse 95%+ of existing React codebase
- 1-2 week conversion time
- Same codebase for web and mobile
- Native plugins for camera, file system, IAP
- Maintained by Ionic team

**Cons**:
- Performance slightly below native
- Some UI won't feel "perfectly native"
- Limited access to cutting-edge native APIs

**Effort Estimate**: 2-4 weeks to production-ready app

### Option 2: React Native (Future Consideration)

**What it is**: Native components rendered by React

**Pros**:
- True native performance
- Native UI components (feels native)
- Larger community
- Better for complex animations

**Cons**:
- Complete rewrite required
- Different navigation paradigm
- Separate codebase from web
- 8-12 week development time

**Recommendation**: Start with Capacitor, evaluate React Native if:
- Performance issues emerge
- App Store reviewers cite quality concerns
- User feedback requests "more native" feel

---

## UI Redesign Priorities

### 1. Navigation Pattern

**Current (Web)**:
```
Header with tabs
┌─────────────────────┐
│  Logo    Tab1 Tab2  │
├─────────────────────┤
│                     │
│    Page Content     │
│                     │
└─────────────────────┘
```

**Target (Native)**:
```
Content area
┌─────────────────────┐
│                     │
│    Page Content     │
│                     │
├─────────────────────┤
│ 🏠  📤  👤  ⚙️     │  ← Bottom tab bar
└─────────────────────┘
```

**Implementation**:
```typescript
// Using @capacitor/app for back button handling
import { App } from '@capacitor/app'

App.addListener('backButton', ({ canGoBack }) => {
  if (canGoBack) {
    window.history.back()
  } else {
    App.exitApp()
  }
})
```

### 2. Upload Flow Redesign

**Current**: HTML `<input type="file">`

**Native Enhancement**:
```typescript
// Capacitor Camera/File plugins
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'
import { FilePicker } from '@capawesome/capacitor-file-picker'

async function selectVideo() {
  // Option 1: Camera roll
  const result = await FilePicker.pickVideos({
    multiple: false
  })

  // Option 2: Record new (future feature)
  // const video = await Camera.getVideo({ source: CameraSource.Camera })
}
```

**UI Improvements**:
- Full-screen picker with preview
- Progress shown in notification tray (background processing)
- "Share to Aura" from Photos app

### 3. Video Handling Optimization

**Current**: Canvas API extraction (works but limited)

**Native Enhancement with AVFoundation**:
```typescript
// Custom Capacitor plugin for iOS
// ios/App/Plugins/VideoExtractor.swift
@objc func extractFrames(_ call: CAPPluginCall) {
    let videoURL = call.getString("path")
    let asset = AVAsset(url: URL(fileURLWithPath: videoURL))
    let generator = AVAssetImageGenerator(asset: asset)

    // Native frame extraction is 3-5x faster than Canvas
    generator.appliesPreferredTrackTransform = true
    // ... extract frames at intervals
}
```

**Benefits**:
- 3-5x faster frame extraction
- Better memory management
- Background processing support
- Native video format handling

### 4. Touch Target Compliance

**Minimum Requirements**:
- iOS: 44pt x 44pt
- Android: 48dp x 48dp

**Current Issues**:
| Element | Current Size | Required | Fix |
|---------|--------------|----------|-----|
| Tab buttons | 36px | 44pt | Increase padding |
| Refresh icons | 24px | 44pt | Add touch wrapper |
| Accordion headers | Variable | 44pt | Set minimum height |
| Chip selectors | 32px | 44pt | Redesign as buttons |

**Implementation**:
```css
/* Mobile-specific touch targets */
@media (pointer: coarse) {
  .touchable {
    min-height: 44px;
    min-width: 44px;
    padding: 12px;
  }
}
```

### 5. Haptic Feedback

**Key Interaction Points**:

| Action | Haptic Type | iOS API | Android API |
|--------|-------------|---------|-------------|
| Save profile | Success | `.success` | `CONFIRM` |
| Delete profile | Warning | `.warning` | `REJECT` |
| Copy to clipboard | Light | `.light` | `TICK` |
| Refresh content | Selection | `.selection` | `CLOCK_TICK` |
| Error | Error | `.error` | `LONG_PRESS` |

**Implementation**:
```typescript
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics'

// Success feedback
await Haptics.notification({ type: NotificationType.Success })

// Button tap
await Haptics.impact({ style: ImpactStyle.Light })
```

---

## In-App Purchase Implementation

### RevenueCat Integration

**Why RevenueCat**:
- Abstracts Apple/Google differences
- Syncs with web Stripe purchases
- Handles receipt validation
- Provides analytics

**Setup**:
```typescript
// src/lib/purchases.ts
import Purchases from '@revenuecat/purchases-capacitor'

export async function initializePurchases(userId: string) {
  await Purchases.configure({
    apiKey: Platform.select({
      ios: 'appl_xxx',
      android: 'goog_xxx'
    }),
    appUserID: userId
  })
}

export async function purchaseCredits(tier: 'starter' | 'popular' | 'power') {
  const offerings = await Purchases.getOfferings()
  const package = offerings.current?.availablePackages.find(
    p => p.identifier === tier
  )

  if (!package) throw new Error('Package not found')

  const { customerInfo } = await Purchases.purchasePackage({ aPackage: package })

  // RevenueCat webhook will credit the account via Supabase
  return customerInfo
}

export async function getSubscriptionStatus() {
  const { customerInfo } = await Purchases.getCustomerInfo()
  return customerInfo.entitlements.active['pro'] !== undefined
}
```

### Pricing Strategy (Apple Commission)

**Web Pricing** (Stripe, no commission):
| Tier | Credits | Price |
|------|---------|-------|
| Starter | 10 | $4.99 |
| Popular | 50 | $19.99 |
| Power | 200 | $59.99 |

**iOS Pricing** (30% Apple commission):
| Tier | Credits | Price | After Commission |
|------|---------|-------|------------------|
| Starter | 10 | $5.99 | $4.19 |
| Popular | 50 | $24.99 | $17.49 |
| Power | 200 | $79.99 | $55.99 |

**Alternative: Reader Rule**
- If users create accounts on web first, can direct to web for purchases
- Cannot promote web purchasing within app
- Gray area - consult legal

---

## Native-Specific Features

### Share Extension (iOS)

Allow "Share to Aura" from Photos app:

```swift
// ios/Share Extension/ShareViewController.swift
class ShareViewController: SLComposeServiceViewController {
    override func didSelectPost() {
        let inputItem = extensionContext?.inputItems.first as? NSExtensionItem
        let itemProvider = inputItem?.attachments?.first

        if itemProvider?.hasItemConformingToTypeIdentifier(kUTTypeMovie as String) {
            itemProvider?.loadItem(forTypeIdentifier: kUTTypeMovie as String) {
                video, error in
                // Save to app group container
                // Open main app with deep link
            }
        }
    }
}
```

### Background Processing

```typescript
// Background task for analysis
import { BackgroundTask } from '@capawesome/capacitor-background-task'

async function analyzeInBackground(videoPath: string) {
  const taskId = await BackgroundTask.beforeExit(async () => {
    // Continue analysis even if app is backgrounded
    await extractAndAnalyze(videoPath)
    BackgroundTask.finish({ taskId })
  })
}
```

### Push Notifications

```typescript
import { PushNotifications } from '@capacitor/push-notifications'

// Request permission on first analysis
async function requestNotificationPermission() {
  const result = await PushNotifications.requestPermissions()
  if (result.receive === 'granted') {
    await PushNotifications.register()
  }
}

// Notify when background analysis completes
async function notifyAnalysisComplete(profileName: string) {
  await LocalNotifications.schedule({
    notifications: [{
      title: 'Analysis Complete',
      body: `${profileName}'s profile is ready to view`,
      id: Date.now()
    }]
  })
}
```

---

## Implementation Roadmap

### Week 1-2: Capacitor Setup

- [ ] Initialize Capacitor project
- [ ] Configure iOS/Android platforms
- [ ] Test existing web app in simulator
- [ ] Fix critical layout issues

### Week 3-4: Navigation & Core UX

- [ ] Implement bottom tab navigation
- [ ] Add native file picker
- [ ] Implement touch target fixes
- [ ] Add haptic feedback

### Week 5-6: Native Integrations

- [ ] RevenueCat setup
- [ ] In-App Purchase testing
- [ ] Background processing
- [ ] Push notifications

### Week 7-8: App Store Preparation

- [ ] Privacy policy updates
- [ ] App Store screenshots
- [ ] Nutrition labels / Data safety
- [ ] TestFlight / Internal testing
- [ ] App Review submission

---

## Testing Checklist

### iOS Testing

- [ ] iPhone SE (small screen)
- [ ] iPhone 15 Pro (notch/dynamic island)
- [ ] iPad (if supporting)
- [ ] iOS 15+ compatibility
- [ ] Dark mode
- [ ] VoiceOver accessibility

### Android Testing

- [ ] Pixel (stock Android)
- [ ] Samsung (One UI)
- [ ] Small screen (< 5")
- [ ] Large screen (> 6.5")
- [ ] TalkBack accessibility
- [ ] Android 10+ compatibility

### Purchase Testing

- [ ] Sandbox purchases (iOS)
- [ ] Test purchases (Android)
- [ ] Subscription upgrade/downgrade
- [ ] Restore purchases
- [ ] Cross-platform sync (web → mobile)

---

## Risk Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| App Store rejection | Medium | High | Pre-review consultation, clear guidelines compliance |
| IAP implementation issues | Medium | High | RevenueCat support, extensive testing |
| Performance complaints | Low | Medium | Performance monitoring, RN fallback plan |
| Platform-specific bugs | High | Low | Comprehensive device testing |

---

## Appendix: Capacitor Plugins Required

| Plugin | Purpose |
|--------|---------|
| `@capacitor/app` | App lifecycle, back button |
| `@capacitor/camera` | Future: video recording |
| `@capacitor/haptics` | Touch feedback |
| `@capacitor/push-notifications` | Completion notifications |
| `@capacitor/share` | Share profiles |
| `@capawesome/capacitor-file-picker` | Video selection |
| `@capawesome/capacitor-background-task` | Background analysis |
| `@revenuecat/purchases-capacitor` | In-App Purchases |
