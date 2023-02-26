// scraper prototype to use at this page `https://ratchakitcha.soc.go.th/ประกาศราชกิจจา/`

var docs = []
$x(`//*[@id="announce"]/ul/li/ul/li/ul/li/div/span/a`).forEach(e => {
    var date = e.parentNode.parentNode.parentNode.parentNode.parentNode.getAttribute('data-id')
    var categoryElem = e.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode
    var category = categoryElem.getElementsByClassName('issue')[0].innerText
    docs.push({
        category,
        date,
        title: e.innerText,
        pdf: e.href
    })
})
console.log(docs)
