## `lifecycleOwner.observeLiveData`
### Snippet
``` js
lifecycleOwner.observeLiveData(daijishouLibraryRepository.getLatestEvent(), (event) => {
    console.log(event);
})
```
### Anatomy 
 Proxy of Java/Kotlin function, from Daijishou.

 `observeLiveData(liveData: LiveData<Any>, listener: (Any) -> Unit)`

### Notes 
 - Lifecycle will align with the extension runtime.
 - Avoid registering the listener twice.
 - This function is implemented by Daijishou..

## `toast`
### Snippet
``` js
toast("Hello world");
```
### Anatomy 
 Proxy of Java/Kotlin function, from Daijishou.

 ``` kt
 val toast = { message: String ->
        extensionManager.lifecycleScope.launch(Dispatchers.Main) {
            Toast.makeText(application, message, Toast.LENGTH_SHORT).show()
        }
    }
 ```


## `showPlayableItemChooserDialog`
### Snippet
``` js
showPlayableItemChooserDialog((playableItem) => { 
    // playableItem is a proxy of Daijishou's PlayableItemEntity Object.
    console.log(playableItem.name)
    console.log(playableItem.playCount)
    console.log(playableItem.isFavorite())
    console.log(playableItem.isVisible())
})
```
### Anatomy 
 Proxy of Java/Kotlin function, from Daijishou.

 ``` kt
val showPlayableItemChooserDialog = { callback: (PlayableItemEntity?) -> Unit ->
    extensionManager.lifecycleScope.launch(Dispatchers.Main) {
        val dialog = ChoosePlayableItemFromLibraryDialogFragment.newInstance()
        val activity = application.mainActivity!!
        var picked = false
        dialog.setOnClickListener {
            Toast.makeText(activity.applicationContext, it.name, Toast.LENGTH_SHORT).show()
            picked = true
            callback(it)
            dialog.dismiss()
        }
        .setOnDialogDismissedListener {
            if(!picked) callback(null);
        }
        .show(activity.supportFragmentManager, ChoosePlayableItemFromLibraryDialogFragment::class.java.name)
    }
}
 ```


## `showAcknowledgementDialog`
### Snippet
``` js
showAcknowledgementDialog("Are you sure?", "The action will cause bla bla bla...", (boolean) => {
    console.log(`Acknowledged: ${boolean}`)
})
```
### Anatomy 
 Proxy of Java/Kotlin function, from Daijishou.

 ``` kt
val showAcknowledgementDialog = { title: String, message: String, callback: (Boolean) -> Unit ->
    extensionManager.lifecycleScope.launch(Dispatchers.Main) {
        val activity = application.mainActivity!!
        AcknowledgementDialogFragment.newInstance(
            title,
            message
        ).setOnAcknowledgedListener {
            callback(true)
        }.setOnCanceledListener {
            callback(false)
        }.show(activity.supportFragmentManager, AcknowledgementDialogFragment::class.java.name)
    }
}
 ```


## `showRetroAchievementsGameDialogByGameId`
### Snippet
``` js
// https://retroachievements.org/game/20562
showRetroAchievementsGameDialogByGameId(20562, (isShown) => {
    console.log(`Is the dialog shown: ${isShown}`)
})
```
### Anatomy 
 Proxy of Java/Kotlin function, from Daijishou.

 ``` kt
val showRetroAchievementsGameDialogByGameId = { gameId: Long, callback: (Boolean) -> Unit ->
    val userId = application.retroAchievementsManager.userIdLiveData.value
    if(userId == null) {
        callback(false)
    }
    else {
        extensionManager.lifecycleScope.launch(Dispatchers.IO) {
            application.retroAchievementsManager.refreshRetroAchievementsGameRecordByGameIdIfExpired(gameId)
            val gameRecord = application.retroAchievementsRepository.
            getRetroAchievementsGameRecordByUserIdAndGameIdStatically(userId, gameId)
            if(gameRecord == null) callback(false)
            else withContext(Dispatchers.Main) {
                val activity = application.mainActivity!!
                RetroAchievementsGameDialogFragment.newInstance(gameRecord.id)
                    .show(activity.supportFragmentManager, RetroAchievementsGameDialogFragment::class.java.name)
                callback(true);
            }
        }
    }
}
 ```