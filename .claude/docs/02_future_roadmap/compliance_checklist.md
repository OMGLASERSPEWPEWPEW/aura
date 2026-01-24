# Compliance Checklist

**Agent Persona**: Legal Advisor
**Date**: January 2026
**Disclaimer**: This document provides guidance, not legal advice. Consult qualified legal counsel before launch.

---

## Executive Summary

Transitioning Aura from a local-only PWA to a cloud-based service with user accounts introduces significant legal and regulatory obligations. This checklist covers GDPR, CCPA, App Store requirements, payment compliance, and dating app-specific regulations.

---

## GDPR Compliance (EU Users)

### Data Controller Obligations

When you store user data on your servers, you become a **data controller** under GDPR.

#### Required Documentation

- [ ] **Privacy Policy** (public-facing)
  - What data is collected
  - Legal basis for processing
  - Data retention periods
  - Third-party processors (Anthropic, Stripe, Supabase)
  - User rights and how to exercise them
  - Contact information for data protection queries

- [ ] **Data Processing Agreement (DPA)**
  - With Anthropic (frames sent for analysis)
  - With Supabase (database hosting)
  - With Stripe (payment processing)

- [ ] **Record of Processing Activities (ROPA)**
  - Internal document listing all processing
  - Purpose for each processing activity
  - Categories of data subjects
  - Data retention schedules

#### User Rights Implementation

| Right | Implementation | Deadline |
|-------|----------------|----------|
| **Right to Access** | Export user data as JSON | 30 days |
| **Right to Erasure** | Full account deletion | 30 days |
| **Right to Rectification** | Edit profile functionality | Immediate |
| **Right to Portability** | Export in machine-readable format | 30 days |
| **Right to Object** | Opt-out of analytics | Immediate |
| **Right to Restrict** | Pause processing | Immediate |

#### Implementation Checklist

- [ ] Account deletion endpoint (`DELETE /auth/account`)
- [ ] Data export endpoint (`GET /user/export`)
- [ ] Consent collection at signup (checkboxes for ToS + Privacy Policy)
- [ ] Consent records stored (timestamp, version, IP)
- [ ] Age verification (18+ only)
- [ ] Cookie consent banner (if using analytics cookies)

#### Data Retention Policy

| Data Type | Retention Period | Justification |
|-----------|------------------|---------------|
| Account data | Until deletion requested | Service provision |
| Analysis history | 2 years | User value |
| Chat history | 2 years | Feature functionality |
| Payment records | 7 years | Tax/legal requirement |
| Server logs | 90 days | Security/debugging |
| Deleted account data | 30 days | Recovery period |

---

## CCPA Compliance (California Users)

### Requirements

- [ ] **"Do Not Sell My Personal Information" link**
  - Required in footer/settings
  - Even if you don't sell data, link must exist
  - Can link to privacy policy section

- [ ] **Privacy Policy Updates**
  - Categories of personal information collected
  - Categories of sources
  - Business purpose for collection
  - Categories of third parties shared with
  - Consumer rights under CCPA

- [ ] **Request Handling**
  - Respond to requests within 45 days
  - Verify identity before processing
  - No discrimination for exercising rights

### Implementation

```typescript
// Settings page
<Link to="/privacy#ccpa">
  Do Not Sell My Personal Information
</Link>

// API endpoint
POST /privacy/do-not-sell
// Sets flag to exclude from any future data sharing
```

---

## App Store Privacy Requirements

### Apple Privacy Nutrition Labels

Required disclosure categories:

| Category | Aura Collection | Linked to Identity |
|----------|-----------------|-------------------|
| Contact Info | Email | Yes |
| Identifiers | User ID | Yes |
| Purchases | Transaction history | Yes |
| Usage Data | Feature usage (if analytics) | Yes |
| User Content | Profile analyses | Yes |
| Sensitive Info | None | N/A |
| Location | City (user-provided) | No |

**Data NOT Collected**:
- Precise location
- Contacts
- Browsing history
- Search history
- Health data
- Financial data

### App Tracking Transparency (ATT)

- [ ] Required if using IDFA for advertising/analytics
- [ ] **If no third-party tracking**: ATT prompt not required
- [ ] **If using analytics (e.g., Mixpanel, Amplitude)**: ATT required

**Recommendation**: Avoid IDFA-based tracking initially to simplify compliance.

### Google Play Data Safety

Similar to Apple, declare:
- [ ] Data collected
- [ ] Data shared with third parties
- [ ] Security practices (encryption in transit/at rest)
- [ ] Data deletion options

---

## Payment Compliance

### PCI DSS

**Good News**: Using Stripe/RevenueCat means you're **not directly handling card data**.

- [ ] Never store card numbers, CVV, or full track data
- [ ] Use Stripe Elements or Checkout (never raw card inputs)
- [ ] Ensure HTTPS on all pages with payment flows
- [ ] Complete Stripe's SAQ-A questionnaire annually

### Refund Policy

Required disclosure before purchase:

```
REFUND POLICY

Credits:
- Unused credits are refundable within 14 days of purchase
- Used credits are non-refundable
- Request refunds via support@aura-app.com

Subscriptions:
- Cancel anytime; access continues until period ends
- Prorated refunds not available
- Annual subscriptions: 30-day money-back guarantee
```

### Receipt Requirements

- [ ] Email receipt for every purchase
- [ ] Include: Date, amount, items, company info
- [ ] Store receipts for 7 years (tax purposes)

---

## Dating App-Specific Compliance

### Age Verification

**Requirement**: Must verify users are 18+

**Implementation Options**:

| Method | Certainty | Friction | Cost |
|--------|-----------|----------|------|
| Checkbox ("I am 18+") | Low | Low | Free |
| Date of birth entry | Medium | Low | Free |
| ID verification | High | High | $1-3/verify |
| Credit card ownership | Medium | Medium | Free |

**Recommendation**: Date of birth at signup + ToS acknowledgment. ID verification for high-risk actions only (if ever needed).

```typescript
// Signup validation
if (calculateAge(dateOfBirth) < 18) {
  throw new Error('You must be 18 or older to use Aura')
}
```

### Content Moderation

**Risk**: AI-generated insights could be offensive or harmful.

- [ ] **Disclaimer**: "Insights are AI-generated and may not be accurate"
- [ ] **Report mechanism**: Allow users to report offensive AI outputs
- [ ] **Content review**: Monitor flagged content for pattern issues
- [ ] **AI guardrails**: Prompt engineering to avoid harmful outputs

### User Safety

| Feature | Required By | Implementation |
|---------|-------------|----------------|
| Block user | App Store | N/A (no user interaction) |
| Report content | App Store | Report AI output button |
| Safety resources | Best practice | Link to dating safety tips |

**Note**: Since Aura analyzes profiles (not facilitating user-to-user interaction), many dating app safety requirements don't apply.

---

## Data Handling Concerns

### Current State (Local-Only)

| Concern | Risk Level | Notes |
|---------|------------|-------|
| User data breach | Very Low | No server storage |
| Third-party access | Low | Only Anthropic sees frames |
| Data loss | Medium | User's device only |

### Future State (Cloud Accounts)

| Concern | Risk Level | Mitigation |
|---------|------------|------------|
| User data breach | Medium | Encryption, access controls, audits |
| Third-party access | Medium | DPAs, vendor security reviews |
| Data loss | Low | Redundant backups |
| Government requests | Low | Transparency report, legal review |

### Anthropic Processor Agreement

**Current Situation**: Video frames sent directly to Anthropic API.

**Required Actions**:
- [ ] Review Anthropic's Terms of Service for data processing
- [ ] Verify Anthropic doesn't train on API inputs (confirmed in their policy)
- [ ] Document Anthropic as a sub-processor in privacy policy
- [ ] Ensure DPA coverage for EU user data

**Relevant Anthropic Policies**:
- API data not used for training
- Data deleted within 30 days
- SOC 2 Type II compliant

---

## Terms of Service Requirements

### Required Sections

1. **Acceptance of Terms**
2. **Account Registration**
   - Age requirement (18+)
   - Accurate information
   - Account security responsibility
3. **Service Description**
   - AI analysis disclaimer
   - Accuracy limitations
4. **Payment Terms**
   - Credit system explanation
   - Subscription terms
   - Refund policy
5. **User Conduct**
   - Prohibited uses
   - Content guidelines
6. **Intellectual Property**
   - App ownership
   - User content license
7. **Disclaimer of Warranties**
   - "As is" provision
   - No guarantee of results
8. **Limitation of Liability**
   - Cap on damages
   - Exclusion of consequential damages
9. **Indemnification**
10. **Termination**
11. **Governing Law & Disputes**
12. **Changes to Terms**

### Critical Disclaimers

```
AI-GENERATED CONTENT DISCLAIMER

The insights, compatibility scores, and suggestions provided by Aura
are generated by artificial intelligence and are for entertainment
and informational purposes only.

Aura does not guarantee the accuracy of any analysis. Users should
exercise their own judgment in dating decisions. Aura is not
responsible for any outcomes resulting from use of the service.
```

```
THIRD-PARTY CONTENT DISCLAIMER

Aura analyzes publicly available dating profile content. Aura does
not control, endorse, or guarantee the accuracy of information
contained in the profiles analyzed. The profile owners' representations
may be inaccurate or misleading.
```

---

## Compliance Timeline

### Pre-Launch (Required)

- [ ] Privacy Policy drafted and reviewed
- [ ] Terms of Service drafted and reviewed
- [ ] Age verification implemented
- [ ] Data export endpoint working
- [ ] Account deletion endpoint working
- [ ] Consent collection at signup

### Launch

- [ ] Privacy policy published at `/privacy`
- [ ] Terms of service published at `/terms`
- [ ] CCPA link in footer
- [ ] App Store privacy labels submitted

### Post-Launch (30 days)

- [ ] DPA with Anthropic confirmed
- [ ] DPA with Supabase confirmed
- [ ] DPA with Stripe confirmed
- [ ] ROPA completed

### Ongoing

- [ ] Annual PCI SAQ-A completion (Stripe)
- [ ] Privacy policy updates (as practices change)
- [ ] User request handling (within 30 days)
- [ ] Security audit (annual recommended)

---

## Cost Estimates

| Item | Estimated Cost | Frequency |
|------|----------------|-----------|
| Legal review of ToS/Privacy | $2,000-5,000 | One-time |
| GDPR consultant | $1,000-3,000 | One-time |
| Privacy policy template | $200-500 | One-time |
| Ongoing legal counsel retainer | $500-2,000/mo | Monthly |
| ID verification (if needed) | $1-3 per verify | Per user |

**Budget Recommendation**: $5,000-10,000 for initial legal setup

---

## Red Flags to Avoid

| Action | Risk | Alternative |
|--------|------|-------------|
| Storing unencrypted user data | Data breach liability | Encrypt at rest |
| Selling user data | GDPR/CCPA violation | Don't sell data |
| No age verification | Legal liability | DOB at signup |
| Ignoring deletion requests | GDPR fine (up to 4% revenue) | Automate deletion |
| No processor agreements | Compliance gap | DPAs with all vendors |
| Misleading privacy claims | FTC investigation | Accurate disclosures |

---

## Resources

- [GDPR Official Text](https://gdpr-info.eu/)
- [CCPA Official Text](https://oag.ca.gov/privacy/ccpa)
- [Apple App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Google Play Policy Center](https://play.google.com/about/developer-content-policy/)
- [Stripe Compliance](https://stripe.com/docs/security)
- [Anthropic Terms of Service](https://www.anthropic.com/terms)
