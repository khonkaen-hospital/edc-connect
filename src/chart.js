const Chart  = require('chart.js');
const Color  = require("color")

var presets = {
	red: 'rgb(255, 99, 132)',
	orange: 'rgb(255, 159, 64)',
	yellow: 'rgb(255, 205, 86)',
	green: 'greenyellow',
	blue: 'rgb(54, 162, 235)',
	purple: 'rgb(153, 102, 255)',
	grey: 'rgb(201, 203, 207)'
};

function dataToTimeSeries(data, fieldTime, fieldValue){
    let timeSeries = data.map(value => {
        return {t: +moment(value[fieldTime]).format('x'), y: value[fieldValue]}
    })
    return timeSeries;
}

function lineChart(canvasId, data) {
    let colorGreen = Color(presets.green)
    let colorRed = Color(presets.red)
    let ctx = document.getElementById(canvasId).getContext('2d');
    let chart = new Chart(ctx, {
        type: 'bar',
        data: {
            datasets: [{
                label: 'อนุมัติ',
                backgroundColor: colorGreen.alpha(0.5),
                borderColor: colorGreen,
                data: data[0],
                type: 'line',
				pointRadius: 0,
                fill: false,
                lineTension: 0,
                borderWidth: 2
            },{
                label: 'ยกเลิก',
                backgroundColor: colorRed.alpha(0.5),
                borderColor: colorRed,
                data: data[1],
                type: 'line',
				pointRadius: 0,
                fill: false,
                lineTension: 0,
                borderWidth: 2
            }]
        },
        options: {
            title: {
                display: true,
                text: 'รายการบิลวันนี้'
            },
            scales: {
                xAxes: [{
                    type: 'time',
                    distribution: 'series',
                    ticks: {
                        source: 'data',
                        autoSkip: true
                    }
                }],
                yAxes: [{
                    scaleLabel: {
                        display: true,
                        labelString: 'ราคา (฿)'
                    }
                }]
            },
            tooltips: {
                intersect: false,
                mode: 'index',
                callbacks: {
                    label: function(tooltipItem, myData) {
                        var label = myData.datasets[tooltipItem.datasetIndex].label || '';
                        if (label) {
                            label += ': ';
                        }
                        label += parseFloat(tooltipItem.value).toFixed(2);
                        return label;
                    }
                }
            }
        }
    });
}

function pieChart(canvasId, data) {
    let ctx = document.getElementById(canvasId).getContext('2d');
    var chart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['รายการที่อนุมัติ', 'รายการที่ยกเลิก'],
            datasets: [{
                label: 'EDC',
                backgroundColor: [
                    Color(presets.green).alpha(0.5),
                    Color(presets.purple).alpha(0.5),
                ],
                data: data
            }]
        },
        options: {
            title: {
                display: true,
                text: 'สัดส่วนบิลทั้งหมด'
            }
        }
    });
    
}

module.exports = {
    lineChart: lineChart,
    pieChart: pieChart,
    dataToTimeSeries: dataToTimeSeries
}