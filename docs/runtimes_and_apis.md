# Daijishou JavaScript Runtimes and APIs

## Environments
Daijishou uses Javet library to enable JavaScript features. Javet provides [V8](https://v8.dev/#:~:text=V8%20is%20Google's%20open%20source,%2C%20ARM%2C%20or%20MIPS%20processors.) environment, it implements [ECMAScript](https://tc39.es/ecma262/) and WebAssembly. 

Therefore, Daijishou V8 Runtime, which is built upon those technologies, is a superset of V8 includes additional APIs and permission controls. Which means that, in general cases, Daijishou V8 Runtime inherits the ECMAScript language features.

Environment | JavaScript Technology | Abbreviation | Notes
-- | -- | -- | -- 
Daijishou Extension Manger V8 Runtime | [V8 by Javet](https://github.com/caoccao/Javet) | V8 | No permission control, less security. For debug purpose, can only be executed by user or Daijishou SDK. 
Daijishou Extension V8 Runtime | [V8 by Javet](https://github.com/caoccao/Javet) | Extension | -- 
WebView | WebView on Android | WebView | No API access, except basic communication with extension modules. 

## Permissions
Permission | Notes
-- | --
`all` | Very dangerous, please be responsible.
`debug` | Very dangerous, please be responsible.
`identification` | Get identification info of Daijishou.
`library` | Daijishou library that manage items and media.
`retro_achievements` | Daijishou Retro Achievements APIs.
`files` | Direct file access.
`internet` | APIs that related to internet.
`notification` | Ability to toast messages.
`export_modules` | Expose and export V8 JavaScript modules.

## APIs
### Global Objects
Object | Type | isProxy | References | Required permissions | Notes
-- | -- | -- | -- | -- | --
**Common (Extension & V8)** |  |  |  |  |  | 
`lifecycleOwner` | Object | ✔️ | [Android lifecycle](https://developer.android.com/topic/libraries/architecture/lifecycle) | -- | Lifecycle object when [observation (LiveData)](https://developer.android.com/topic/libraries/architecture/livedata) is needed.
`lifecycleOwner.observeLiveData`| Function | ✔️ | [Android lifecycle](https://developer.android.com/topic/libraries/architecture/lifecycle), [Example](./examples/common.md#lifecycleownerobservelivedata) | -- | This is a function polyfill by Daijishou. 
**File (Extension & V8)** |  |  |  |  |  | 
`File` | Class | ✔️ | [Java File](https://docs.oracle.com/javase/8/docs/api/java/io/File.html) | `files` | --
`Files` | Object | ✔️ | [Java Files](https://docs.oracle.com/javase/8/docs/api/java/nio/file/Files.html) | `files` | --
`Path` | Class | ✔️ | [Java Path](https://docs.oracle.com/javase/8/docs/api/java/nio/file/Path.html) | `files` | --
`Paths` | Object | ✔️ | [Java Paths](https://docs.oracle.com/javase/8/docs/api/java/nio/file/Paths.htmll) | `files` | --
**Database (Extension & V8)** |  |  |  |  |  | 
`daijishouLibraryRepository` | Object | ✔️ | [Documentation]() | `library` | --
`retroAchievementsRepository` | Object | ✔️ | [Documentation]() | `retro_achievements` | --
**Internet  (Extension & V8)** |  |  |  |  |  | 
`Jsoup` | Object | ✔️ | [Jsoup](https://jsoup.org/) | `internet` | --
`dsess` | Object | ✔️ | [Documentation]() | `internet` | --
`scraper` | Object | ✔️ | [Documentation]() | `internet` | --
**Daijishou  (Extension & V8)** |  |  |  |  |  | 
`application` | Object | ✔️ | [Android application](https://developer.android.com/reference/android/app/Application) | `all` | Daijishou Application Object. This object is for debug, and internal uses.
`daijishouUUID` | String | ❌ | -- | `identification` | Daijishou UUID of the device.
`daijishouVersionCode` | Int | ❌ | -- | -- | Daijishou's version.
`daijishouVersionName` | String | ❌ | -- | -- | Daijishou's version.
-- | -- | -- | -- | -- | -- | --