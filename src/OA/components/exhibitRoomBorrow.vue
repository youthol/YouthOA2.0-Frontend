<script setup>
import { onMounted, ref, defineExpose } from 'vue'
import { http } from 'assets/js/http'
import * as echarts from 'echarts'

let _width = ref('100%')
let _height = ref('820px')
let showData = ref()
var roomBorrowData

function GetRoomBorrow() {
  http
    .post('/GetRoomBorrow/', {})
    .then((res) => {
      roomBorrowData = res.data
    })
    .then(() => {
      draw()
    })
    .catch((err) => {
      console.log(err)
    })
}

var option

var HEIGHT_RATIO = 0.6
var DIM_CATEGORY_INDEX = 0
var DIM_TIME_START = 1
var DIM_TIME_END = 2
var DATA_ZOOM_AUTO_MOVE_THROTTLE = 30
var DATA_ZOOM_X_INSIDE_INDEX = 1
var DATA_ZOOM_Y_INSIDE_INDEX = 3
var DATA_ZOOM_AUTO_MOVE_SPEED = 0.2
var DATA_ZOOM_AUTO_MOVE_DETECT_AREA_WIDTH = 30
var _draggable
var _draggingEl
var _dropShadow
var _draggingCursorOffset = [0, 0]
var _draggingTimeLength
var _draggingRecord
var _dropRecord
var _cartesianXBounds = []
var _cartesianYBounds = []
var _autoDataZoomAnimator
let myChart
let _option = null
function draw() {
  myChart = echarts.init(showData.value)
  _option = makeOption()
  option = _option
  myChart.setOption(option)
  initDrag()
}

function makeOption() {
  return {
    tooltip: {},
    animation: true,
    animationDuration: 1000,
    animationDurationUpdate: 1000,
    title: {
      text: '房间借用情况',
      left: 'center'
    },
    dataZoom: [
      {
        type: 'slider',
        xAxisIndex: 0,
        filterMode: 'weakFilter',
        height: 20,
        bottom: 0,
        start: 0,
        end: 100,
        handleIcon:
          'path://M10.7,11.9H9.3c-4.9,0.3-8.8,4.4-8.8,9.4c0,5,3.9,9.1,8.8,9.4h1.3c4.9-0.3,8.8-4.4,8.8-9.4C19.5,16.3,15.6,12.2,10.7,11.9z M13.3,24.4H6.7V23h6.6V24.4z M13.3,19.6H6.7v-1.4h6.6V19.6z',
        handleSize: '80%',
        showDetail: false
      },
      {
        type: 'inside',
        id: 'insideX',
        xAxisIndex: 0,
        filterMode: 'weakFilter',
        start: 0,
        end: 26,
        zoomOnMouseWheel: false,
        moveOnMouseMove: true
      },
      {
        type: 'slider',
        yAxisIndex: 0,
        zoomLock: true,
        width: 10,
        right: 10,
        top: 70,
        bottom: 20,
        start: 0,
        end: 100,
        handleSize: 0,
        showDetail: false
      },
      {
        type: 'inside',
        id: 'insideY',
        yAxisIndex: 0,
        start: 0,
        end: 100,
        zoomOnMouseWheel: false,
        moveOnMouseMove: true,
        moveOnMouseWheel: true
      }
    ],
    grid: {
      show: true,
      top: 70,
      bottom: 20,
      left: 100,
      right: 20,
      backgroundColor: '#fff',
      borderWidth: 0
    },
    xAxis: {
      type: 'time',
      position: 'top',
      splitLine: {
        lineStyle: {
          color: ['#E9EDFF']
        }
      },
      min: '2023/7/8 08:00',
      max: '2023/7/8 22:00',
      axisLine: {
        show: false
      },
      axisTick: {
        lineStyle: {
          color: '#929ABA'
        }
      },
      axisLabel: {
        color: '#929ABA',
        inside: false,
        align: 'center'
      }
    },
    yAxis: {
      axisTick: { show: false },
      splitLine: { show: false },
      axisLine: { show: false },
      axisLabel: { show: false },
      min: 0,
      max: roomBorrowData.recent14Day.data.length
    },
    series: [
      {
        id: 'borrowTime',
        type: 'custom',
        renderItem: renderGanttItem,
        dimensions: roomBorrowData.borrowTime.dimensions,
        encode: {
          x: [DIM_TIME_START, DIM_TIME_END],
          y: DIM_CATEGORY_INDEX,
          tooltip: [3, 4, 5]
        },
        animation: true,
        data: roomBorrowData.borrowTime.data
      },
      {
        type: 'custom',
        renderItem: renderAxisLabelItem,
        dimensions: roomBorrowData.recent14Day.dimensions,
        encode: {
          x: -1,
          y: 0,
          tooltip: [1]
        },
        data: roomBorrowData.recent14Day.data.map(function (item, index) {
          return [index].concat(item)
        })
      }
    ]
  }
}
function renderGanttItem(params, api) {
  var categoryIndex = api.value(DIM_CATEGORY_INDEX)
  var timeStart = api.coord([api.value(DIM_TIME_START), categoryIndex])
  var timeEnd = api.coord([api.value(DIM_TIME_END), categoryIndex])
  var coordSys = params.coordSys
  _cartesianXBounds[0] = coordSys.x
  _cartesianXBounds[1] = coordSys.x + coordSys.width
  _cartesianYBounds[0] = coordSys.y
  _cartesianYBounds[1] = coordSys.y + coordSys.height
  var barLength = timeEnd[0] - timeStart[0]
  // Get the heigth corresponds to length 1 on y axis.
  var barHeight = api.size([0, 1])[1] * HEIGHT_RATIO
  var x = timeStart[0]
  var y = timeStart[1] - barHeight
  var borrowDepartment = api.value(3) + ''
  var departmentWidth = echarts.format.getTextRect(borrowDepartment).width
  var text = barLength > departmentWidth && x + barLength >= 80 ? borrowDepartment : ''
  var rectNormal = clipRectByRect(params, {
    x: x,
    y: y,
    width: barLength,
    height: barHeight
  })

  rectNormal.r = [10]

  var rectText = clipRectByRect(params, {
    x: x,
    y: y,
    width: barLength,
    height: barHeight
  })

  // 设置颜色
  let _color = '#008aff'
  if (borrowDepartment == '当前选择') {
    _color = 'red'
  }
  if (borrowDepartment == '程序部') {
    _color = '#f68512'
  } else if (borrowDepartment == '媒体中心') {
    _color = '#12bc79'
  } else if (borrowDepartment == '摄影部') {
    _color = '#29b8db'
  }

  return {
    type: 'group',
    children: [
      {
        type: 'rect',
        ignore: !rectNormal,
        shape: rectNormal,
        style: {
          fill: _color,
          stroke: '#fff'
        }
      },
      {
        type: 'rect',
        ignore: !rectText,
        shape: rectText,
        style: {
          fill: 'transparent',
          stroke: 'transparent',
          text: text,
          textFill: '#fff'
        }
      }
    ]
  }
}
function renderAxisLabelItem(params, api) {
  var y = api.coord([0, api.value(0)])[1]
  if (y < params.coordSys.y + 5) {
    return
  }
  return {
    type: 'group',
    position: [10, y],
    children: [
      {
        type: 'text',
        style: {
          x: 24,
          y: -3,
          fontWeight: 'bold',
          text: api.value(1),
          textVerticalAlign: 'bottom',
          textAlign: 'center',
          textFill: '#008aff'
        }
      }
    ]
  }
}
function clipRectByRect(params, rect) {
  return echarts.graphic.clipRectByRect(rect, {
    x: params.coordSys.x,
    y: params.coordSys.y,
    width: params.coordSys.width,
    height: params.coordSys.height
  })
}
// -------------
//  Enable Drag
// -------------

function initDrag() {
  _autoDataZoomAnimator = makeAnimator(dispatchDataZoom)
  myChart.on('mousedown', function (param) {
    if (!_draggable || !param || param.seriesIndex == null) {
      return
    }
    // Drag start
    _draggingRecord = {
      dataIndex: param.dataIndex,
      categoryIndex: param.value[DIM_CATEGORY_INDEX],
      timeArrival: param.value[DIM_TIME_START],
      timeDeparture: param.value[DIM_TIME_END]
    }
    var style = {
      lineWidth: 2,
      fill: 'rgba(255,0,0,0.1)',
      stroke: 'rgba(255,0,0,0.8)',
      lineDash: [6, 3]
    }
    _draggingEl = addOrUpdateBar(_draggingEl, _draggingRecord, style, 100)
    _draggingCursorOffset = [
      _draggingEl.position[0] - param.event.offsetX,
      _draggingEl.position[1] - param.event.offsetY
    ]
    _draggingTimeLength = _draggingRecord.timeDeparture - _draggingRecord.timeArrival
  })
  myChart.getZr().on('mousemove', function (event) {
    if (!_draggingEl) {
      return
    }
    var cursorX = event.offsetX
    var cursorY = event.offsetY
    // Move _draggingEl.
    _draggingEl.attr('position', [
      _draggingCursorOffset[0] + cursorX,
      _draggingCursorOffset[1] + cursorY
    ])
    prepareDrop()
    autoDataZoomWhenDraggingOutside(cursorX, cursorY)
  })
  myChart.getZr().on('mouseup', function () {
    // Drop
    if (_draggingEl && _dropRecord) {
      updateRawData() &&
        myChart.setOption({
          series: {
            id: 'borrowTime',
            data: roomBorrowData.borrowTime.data
          }
        })
    }
    dragRelease()
  })
  myChart.getZr().on('globalout', dragRelease)
  function dragRelease() {
    _autoDataZoomAnimator.stop()
    if (_draggingEl) {
      myChart.getZr().remove(_draggingEl)
      _draggingEl = null
    }
    if (_dropShadow) {
      myChart.getZr().remove(_dropShadow)
      _dropShadow = null
    }
    _dropRecord = _draggingRecord = null
  }
  function addOrUpdateBar(el, itemData, style, z) {
    var pointArrival = myChart.convertToPixel('grid', [
      itemData.timeArrival,
      itemData.categoryIndex
    ])
    var pointDeparture = myChart.convertToPixel('grid', [
      itemData.timeDeparture,
      itemData.categoryIndex
    ])
    var barLength = pointDeparture[0] - pointArrival[0]
    var barHeight =
      Math.abs(
        myChart.convertToPixel('grid', [0, 0])[1] - myChart.convertToPixel('grid', [0, 1])[1]
      ) * HEIGHT_RATIO
    if (!el) {
      el = new echarts.graphic.Rect({
        shape: { x: 0, y: 0, width: 0, height: 0 },
        style: style,
        z: z
      })
      myChart.getZr().add(el)
    }
    el.attr({
      shape: { x: 0, y: 0, width: barLength, height: barHeight },
      position: [pointArrival[0], pointArrival[1] - barHeight]
    })
    return el
  }
  function prepareDrop() {
    // Check droppable place.
    var xPixel = _draggingEl.shape.x + _draggingEl.position[0]
    var yPixel = _draggingEl.shape.y + _draggingEl.position[1]
    var cursorData = myChart.convertFromPixel('grid', [xPixel, yPixel])
    if (cursorData) {
      // Make drop shadow and _dropRecord
      _dropRecord = {
        categoryIndex: Math.floor(cursorData[1]),
        timeArrival: cursorData[0],
        timeDeparture: cursorData[0] + _draggingTimeLength
      }
      var style = { fill: 'rgba(0,0,0,0.4)' }
      _dropShadow = addOrUpdateBar(_dropShadow, _dropRecord, style, 99)
    }
  }
  // This is some business logic, don't care about it.
  function updateRawData() {
    var borrowTime = roomBorrowData.borrowTime.data
    var movingItem = borrowTime[_draggingRecord.dataIndex]
    // Check conflict
    for (var i = 0; i < borrowTime.length; i++) {
      var dataItem = borrowTime[i]
      if (
        dataItem !== movingItem &&
        _dropRecord.categoryIndex === dataItem[DIM_CATEGORY_INDEX] &&
        _dropRecord.timeArrival < dataItem[DIM_TIME_END] &&
        _dropRecord.timeDeparture > dataItem[DIM_TIME_START]
      ) {
        alert('Conflict! Find a free space to settle the bar!')
        return
      }
    }
    // No conflict.
    movingItem[DIM_CATEGORY_INDEX] = _dropRecord.categoryIndex
    movingItem[DIM_TIME_START] = _dropRecord.timeArrival
    movingItem[DIM_TIME_END] = _dropRecord.timeDeparture
    return true
  }
  function autoDataZoomWhenDraggingOutside(cursorX, cursorY) {
    // When cursor is outside the cartesian and being dragging,
    // auto move the dataZooms.
    var cursorDistX = getCursorCartesianDist(cursorX, _cartesianXBounds)
    var cursorDistY = getCursorCartesianDist(cursorY, _cartesianYBounds)
    if (cursorDistX !== 0 || cursorDistY !== 0) {
      _autoDataZoomAnimator.start({
        cursorDistX: cursorDistX,
        cursorDistY: cursorDistY
      })
    } else {
      _autoDataZoomAnimator.stop()
    }
  }
  function dispatchDataZoom(params) {
    var option = myChart.getOption()
    var optionInsideX = option.dataZoom[DATA_ZOOM_X_INSIDE_INDEX]
    var optionInsideY = option.dataZoom[DATA_ZOOM_Y_INSIDE_INDEX]
    var batch = []
    prepareBatch(batch, 'insideX', optionInsideX.start, optionInsideX.end, params.cursorDistX)
    prepareBatch(batch, 'insideY', optionInsideY.start, optionInsideY.end, -params.cursorDistY)
    batch.length &&
      myChart.dispatchAction({
        type: 'dataZoom',
        batch: batch
      })
    function prepareBatch(batch, id, start, end, cursorDist) {
      if (cursorDist === 0) {
        return
      }
      var sign = cursorDist / Math.abs(cursorDist)
      var size = end - start
      var delta = DATA_ZOOM_AUTO_MOVE_SPEED * sign
      start += delta
      end += delta
      if (end > 100) {
        end = 100
        start = end - size
      }
      if (start < 0) {
        start = 0
        end = start + size
      }
      batch.push({
        dataZoomId: id,
        start: start,
        end: end
      })
    }
  }
  function getCursorCartesianDist(cursorXY, bounds) {
    var dist0 = cursorXY - (bounds[0] + DATA_ZOOM_AUTO_MOVE_DETECT_AREA_WIDTH)
    var dist1 = cursorXY - (bounds[1] - DATA_ZOOM_AUTO_MOVE_DETECT_AREA_WIDTH)
    return dist0 * dist1 <= 0
      ? 0 // cursor is in cartesian
      : dist0 < 0
        ? dist0 // cursor is at left/top of cartesian
        : dist1 // cursor is at right/bottom of cartesian
  }
  function makeAnimator(callback) {
    var requestId
    var callbackParams
    // Use throttle to prevent from calling dispatchAction frequently.
    callback = echarts.throttle(callback, DATA_ZOOM_AUTO_MOVE_THROTTLE)
    function onFrame() {
      callback(callbackParams)
      requestId = requestAnimationFrame(onFrame)
    }
    return {
      start: function (params) {
        callbackParams = params
        if (requestId == null) {
          onFrame()
        }
      },
      stop: function () {
        if (requestId != null) {
          cancelAnimationFrame(requestId)
        }
        requestId = callbackParams = null
      }
    }
  }
}

option && myChart.setOption(option)

onMounted(() => {
  GetRoomBorrow()
})

const add = (date, start, end) => {
  if (roomBorrowData == null || myChart == null) return
  let new_option = makeOption()
  for (let i = 0; i < roomBorrowData.borrowTime.data.length; i++) {
    if (roomBorrowData.borrowTime.data[i][3] == '当前选择') {
      roomBorrowData.borrowTime.data.splice(i, 1)
      break
    }
  }
  new_option.series[0].data.push([
    date,
    '2023/07/08 ' + start,
    '2023/07/08 ' + end,
    '当前选择',
    start,
    end
  ])
  myChart.setOption(new_option, { notMerge: true })
  //   let count = 0

  //   if (temp_interval !== undefined) {
  //     clearInterval(temp_interval)
  //   }
  //   temp_interval = setInterval(function () {
  //     if (count % 2 === 0) {
  //       // 添加元素
  //       new_option.series[0].data.push([
  //         date,
  //         '2023/07/08 ' + start,
  //         '2023/07/08 ' + end,
  //         '当前选择',
  //         start,
  //         end
  //       ])
  //       myChart.setOption(new_option, { notMerge: true })
  //     } else {
  //       // 删除元素
  //       for (let i = 0; i < roomBorrowData.borrowTime.data.length; i++) {
  //         if (roomBorrowData.borrowTime.data[i][3] == '当前选择') {
  //           roomBorrowData.borrowTime.data.splice(i, 1)
  //           break
  //         }
  //       }
  //       myChart.setOption(new_option, { notMerge: true })
  //     }

  //     count++
  //     count %= 2
  //     // 如果达到指定次数，清除定时器
  //   }, 1000)
}

const GetNewData = () => {
  http
    .post('/GetRoomBorrow/', {})
    .then((res) => {
      roomBorrowData = res.data
      console.log(res.data)
    })
    .then(() => {
      _option = makeOption()
    })
    .then(() => {
      myChart.setOption(_option, { notMerge: true })
    })
    .catch((err) => {
      console.log(err)
    })
}
defineExpose({
  add,
  GetNewData
})
</script>

<template>
  <div ref="showData" class="chart" :style="{ '--width': _width, '--height': _height }"></div>
</template>

<style scoped>
.chart {
  width: var(--width);
  height: var(--height);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
</style>
