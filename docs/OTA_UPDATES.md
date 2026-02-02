# Over-The-Air (OTA) Updates Guide

This guide explains how to deploy updates to your users instantly without going through the App Store or Play Store review process.

## 🚀 How to Publish an Update

To publish changes to your JavaScript, styling, or assets (images/fonts):

### For Production (Live Users)
```bash
eas update --channel production --message "Description of your changes"
```
*   **Target**: Users who have the App Store / Play Store version installed.
*   **Effect**: They will download the update seamlessly in the background.

### For Preview (Internal Testing)
```bash
eas update --channel preview --message "Description of changes"
```
*   **Target**: Testers using the internal build.

## ⚠️ When to use OTA vs New Build

| Change Type | Method | Command |
| :--- | :--- | :--- |
| **JS / Logic / UI** | OTA Update | `eas update ...` |
| **Assets (Images)** | OTA Update | `eas update ...` |
| **App Icon / Splash** | **New Build** | `eas build ...` |
| **native binary** | **New Build** | `eas build ...` |
| **New Permissions** | **New Build** | `eas build ...` |
| **Expo SDK Upgrade**| **New Build** | `eas build ...` |

## 🔄 How it Works
1.  You run `eas update`.
2.  Expo bundles your JS and assets.
3.  The bundle is uploaded to EAS servers.
4.  When a user opens the app, it checks for updates.
5.  If a new update exists for their **channel**, it downloads in the background.
6.  The user sees the new version on next restart.

## 🔍 Troubleshooting
-   **Check Status**: Run `eas update:list` to see history.
-   **Rollback**: You can re-publish an older update if a new one breaks something.
