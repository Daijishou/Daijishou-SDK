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
