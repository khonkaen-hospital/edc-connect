 
map = (array, from, to) => {
    return array
    .filter( value => value.hasOwnProperty(from) && value.hasOwnProperty(to))
    .map( value => { return { id: value[from], label: value[to]}; });
}

buildHtmlOptions = (tagId, data=[]) => {
    let selectInput = document.getElementById(tagId);
    selectInput.innerHTML = "";
    data.forEach((value) => {
        var opt = document.createElement("option");
        opt.appendChild(document.createTextNode(value['label']));
        opt.value = value['id'];
        selectInput.appendChild(opt);
    });
    
}

 module.exports =  {
    buildHtmlOptions: buildHtmlOptions,
    map: map
 }