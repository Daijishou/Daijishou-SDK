// \fileop push ./test_files/manager_runtime daijishou-file://extension_manager
// \extensions js_file daijishou-file://extension_manager/index.js
// \fileop list daijishou-file://extension_manager/
// \js scraper.scrapeGenresByKeywords(["DSESS:BOX_ART:TAGS(scraperKeyword):https://thegamesdb.net/search.php?name=%7BscraperKeyword%7D&platform_id%5B%5D=4&dsess_selector=img.card-img-top&dsess_attribute=src&dsess_replacer=images%5C%2F.%2A%5C%2Fboxart&dsess_replacer_value=images%2Foriginal%2Fboxart"], null, ["pokemon"])
// \js 
import {test} from "./modules/module1.js"

// test("before")
// throw new Error("123")
// test(fs)
// test("after")

console.log(daijishouUUID);
// console.log(toast);
// toast(daijishouUUID);
const platforms = application.daijishouLibraryRepository.getAllPlatformsStatically()
const platformNames = []
platforms.forEach(platform => {
    platformNames.push(platform.name);
})
console.log(platformNames);
console.log(lifecycleOwner);
// console.log(lifecycleScope);
console.log(daijishouLibraryRepository.getLatestEventStatically());

lifecycleOwner.observeLiveData(daijishouLibraryRepository.getLatestEvent(), (event) => {
    const playableItem = daijishouLibraryRepository.getPlayableItemByIdStatically(event.playableItemId);
    console.log(`${playableItem}\n\n${event}`);

})
// daijishouLibraryRepository.getLatestEvent().observe(lifecycleOwner, (event) => {
//     console.log(event);
// })
// export default 123

