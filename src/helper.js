var $ = require("jquery");
var dt = require("datatables.net")(window, $);

map = (array, from, to) => {
  return array
    .filter(value => value.hasOwnProperty(from) && value.hasOwnProperty(to))
    .map(value => {
      return { id: value[from], label: value[to] };
    });
};

buildHtmlOptions = (tagId, data = []) => {
  let selectInput = document.getElementById(tagId);
  selectInput.innerHTML = "";
  data.forEach(value => {
    var opt = document.createElement("option");
    opt.appendChild(document.createTextNode(value["label"]));
    opt.value = value["id"];
    selectInput.appendChild(opt);
  });
};

function setActiveMenu(
  containerId = "menus",
  className = "menu",
  activeClassName = "active"
) {
  let menusContainer = document.getElementById(containerId);
  let menus = menusContainer.getElementsByClassName(className);
  for (const key in menus) {
    if (menus.hasOwnProperty(key)) {
      const element = menus[key];
      element.addEventListener("click", function () {
        let current = menusContainer.getElementsByClassName(activeClassName);
        if (current.length == 1) {
          current[0].className = current[0].className.replace(
            " " + activeClassName,
            ""
          );
        }
        this.className += " " + activeClassName;
      });
    }
  }
}

function setActivePage(
  containerId = "menus",
  className = "menu",
  activeClassName = "pageActive"
) {
  let menusContainer = document.getElementById(containerId);
  let menus = menusContainer.getElementsByClassName(className);
  for (const key in menus) {
    if (menus.hasOwnProperty(key)) {
      const element = menus[key];
      element.addEventListener("click", function (e) {
        // get active page & remove class acctive
        let current = document.getElementsByClassName(activeClassName);
        if (current.length == 1) {
          current[0].style.display = "none";
          current[0].className = current[0].className.replace(
            " " + activeClassName,
            ""
          );
        }
        // set active new page
        let pageId = e.srcElement.getAttribute("data-page");
        let pageActive = document.getElementById(pageId);
        pageActive.style.display = "block";
        pageActive.className += " " + activeClassName;
      });
    }
  }
}

function initDataTable(dataTableId = "#table_id") {
  let dataTable = $(dataTableId).DataTable({
    dom: "Bflrtip",
    buttons: ["csv", "excel", "pdf"],
    paging: true,
    pageLength: 15,
    lengthChange: false,
    ordering: true,
    info: false,
    data: approveData,
    select: true,
    order: [[6, "desc"]],
    columns: [
      { title: "HN", width: "10%" },
      { title: "VN", width: "10%" },
      { title: "ชื่อ-นามสกุล" },
      { title: "จำนวนเงิน", width: "18%" },
      { title: "Approve Code", width: "10%" },
      { title: "เวลา", width: "5%" },
      { title: "สถานะ", width: "15%" },
      { title: "ยกเลิก", width: "5%" }
    ]
  });
  return dataTable;
}

module.exports = {
  initDataTable: initDataTable,
  buildHtmlOptions: buildHtmlOptions,
  map: map,
  setActiveMenu: setActiveMenu,
  setActivePage: setActivePage
};
