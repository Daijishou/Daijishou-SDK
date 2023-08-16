## `lifecycleOwner.observeLiveData`
### Snippet
``` js
lifecycleOwner.observeLiveData(daijishouLibraryRepository.getLatestEvent(), (event) => {
    console.log(event);
})
```
### Anatomy 
 Proxy of Java/Kotlin function 

 `observeLiveData(liveData: LiveData<Any>, listener: (Any) -> Unit)`

### Notes 
 - Lifecycle will align with the extension runtime.
 - Avoid registering the listener twice.

## `toast`
### Snippet
``` js
toast("Hello world");
```
### Anatomy 
 Proxy of Java/Kotlin function 

 ``` kt
 val toast = { message: String ->
        extensionManager.lifecycleScope.launch(Dispatchers.Main) {
            Toast.makeText(application, message, Toast.LENGTH_SHORT).show()
        }
    }
 ```