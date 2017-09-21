

(function(factory,window){
    var $ = window.jQuery || window.jquery || window.$;
    if(!$){
        throw new Error('It need a jQuery Object');
    }
    window.$ = $;
    factory(window);


})(function(window){
    var $ = window.$;

    var bigMonths = [1, 3, 5, 7, 8, 10, 12];
    var smallMonths = [4, 6, 9, 11];
    var specialMonth = 2;
    var days = ["日", "一", "二", "三", "四", "五", "六"];
    var body;
    var splitArr = ['\s','-','/','_'];        //可识别的连接符
    var splitStr = splitArr.join('\\');
    var NumReg = new RegExp('^(\\\d{4})(['+splitStr+']?)(\\\d{2})(['+splitStr+']?)(\\\d{2})$','ig');    //检测日期格式是否正确以及识别年月日
    var formatReg = new RegExp('^y{4}(['+splitStr+']?)m{2}(['+splitStr+']?)d{2}$','ig');            //检测日期格式是否正确以及识别年月日之间的连接符
    var maxYear = 27650;        //最大的年份数

    var dateObj = {
        year: '',
        month: '',
        lastMonth: '',
        date: '',
        day: '',
        endDate: ''
    };

    var dateSelectDefaults = {
        isClickAnimate: true,
        initDate: null,
        yearEnd: 27650,
        format:'yyyy-MM-dd',
        cssStyle:null,
        isFixed:false
    }

    $.fn.dateSelect = function (option) {
        body = window.document.body;
        maxYear = option.yearEnd;
        var curInput;                               //当有多个input时可用于确定当前使用的input元素
        var splitWord = initFormat(option.format);  //日期的连接符
        var dateSelectObj = new dateSelect(option);
        //如果isFixed是true,则不运行下一个return的初始化
        if(option.isFixed){
            return;
        }
        return $(this).each(function () {
            var $self = $(this);
            //用于点击className为非dateSelect的时候，隐藏日历版
            $('html').on('click', function (event) {
                var e = event || window.event;
                if ($(e.target).attr('class') != 'dateSelectBox') {
                    dateSelectObj.container.addClass('hideTable');
                }
                stopTran(event);
            });

            //用于点击日历版的时候，不被上层捕获
            dateSelectObj.container.on('click',function(event){
                var e = event || window.event;
                stopTran(event);
            })

            //检测input的输入
            $self.on('keyup', function(event){
                var value = $self.val();
                dateSelectObj.dateShow = [];
                dateSelectObj.initDate(value);
                dateSelectObj.paintForm(dateObj);
            })

            //检测input的focus时间
            $self.on('focus', function (event) {
                var value = $self.val();
                dateSelectObj.dateShow = [];
                dateSelectObj.initDate(value);
                dateSelectObj.paintForm(dateObj);
                var left = offLeft($(this));
                var top = offTop($(this)) + parseInt($(this).css("padding-top")) + parseInt($(this).css("padding-bottom")) + parseInt($(this).outerHeight());
                dateSelectObj.container.removeClass('hideTable').css({
                    top: top,
                    left: left
                });
                curInput = $self;
                stopTran(event);
            });
            //点击input时不被上层元素捕获
            $self.on('click', function (event) {
                stopTran(event);
            });

            //输入值到input元素中
            dateSelectObj.dateComfirm.on('click', function (event) {
                var value = dateObj.year + splitWord + (dateObj.month>9 ? dateObj.month : "0"+dateObj.month) + splitWord + (dateObj.date>9 ? dateObj.date : "0"+dateObj.date);
                curInput.val(value);
                dateSelectObj.container.addClass('hideTable');
            });
        });
    };

    function dateSelect(option){
        this.option = $.extend({}, dateSelectDefaults, option || {});
        this.container;
        this.dateInput = this.yearSelect = this.monthSelect = this.yearInputBox;
        this.reduceYear = this.reduceMonth = this.addYear = this.addMonth;
        this.dateCancel = this.dateComfirm;
        this.dateShow = [];
        this.childELes = [];
        this.init(option);
        if(this.option.isFixed){
            var style = $.extend({},{'position':'absolute','top':"0px",'left':'0px'},this.option.cssStyle);
            this.container.css(style);
            this.showDateBox();
        }
    }

    //初始化日期选择器
    dateSelect.prototype.init = function(option) {
        var that = this;
        this.initTable();
        this.initDate(option.initDate);
        this.paintForm(dateObj);
        this.reduceYear.on('click', function (event) {
            that.yearChange(that.yearSelect, false);
        });
        this.reduceMonth.on('click', function (event) {
            that.monthChange(that.monthSelect, false);
        });
        this.addYear.on('click', function (event) {
            that.yearChange(that.yearSelect, true);
        });
        this.addMonth.on('click', function (event) {
            that.monthChange(that.monthSelect, true);
        });
        this.yearSelect.on('click', function (event) {
            var self = $(this);
            that.yearSelect.hide();
            that.yearInput.removeClass('hidden');
            that.yearInput.focus();
        });
        this.monthSelect.on('click', function (event) {
            var self = $(this);
            that.monthSelect.hide();
            that.monthInput.removeClass('hidden');
            that.monthInput.focus();
        });
        if(!this.option.isFixed){
            this.dateCancel.on('click', function (event) {
                that.container.addClass('hideTable');
            });
        }

        this.initButton();
    };

    //检测年月的输入框事件
    dateSelect.prototype.initButton = function(){
        var that = this;
        this.monthInput.val('');
        this.monthInput.on('blur keyup', function (event) {
            var code = event.keyCode || event.which;
            if(code === 0 || code == '13'){
                that.monthSelect.show();
                that.monthInput.addClass('hidden');
                that.monthChange(that.monthInput);
            }
            stopTran(event);
        });


        this.yearInput.val('');
        this.yearInput.on('blur keyup', function (event) {
            var code = event.keyCode || event.which;
            if(code === 0 || code == '13'){
                that.yearSelect.show();
                that.yearInput.addClass('hidden');
                that.yearChange(that.yearInput);
            }
            stopTran(event);
        });
    }

    //显示日期选择器
    dateSelect.prototype.showDateBox = function() {
        if (this.container.hasClass('hideTable')) {
            this.container.removeClass('hideTable');
        }
    }

    //检测年份变化的函数
    dateSelect.prototype.yearChange = function(obj, direct) {
        var newYear = obj.text() || obj.val();
        newYear = parseInt(newYear);
        obj.val('');
        if (typeof direct != 'undefined' && direct !== null) {
            newYear = direct ? newYear + 1 : newYear - 1;
        }else{
            if(dateObj.year == newYear)return;
        }
        if (newYear < 0 || !newYear) {
            return;
        }
        if (newYear > maxYear) {
            return;
        }
        this.dateShow = [];
        this.yearSelect.text(newYear);
        dateObj.year = newYear;
        this.getDates(dateObj);
        return this.paintForm(dateObj);
    }

    //检测月份变化的函数
    dateSelect.prototype.monthChange = function(obj, direct) {
        var newMonth = obj.text() || obj.val();
        newMonth = parseInt(newMonth);
        obj.val('');
        if (direct !== undefined) {
            newMonth = direct ? newMonth + 1 : newMonth - 1;
        }
        if (newMonth > 12) {
            newMonth = 12;
        }
        if (newMonth < 1) {
            newMonth = 1;
        }
        if (!newMonth) {
            return;
        }
        this.dateShow = [];
        this.monthSelect.text(newMonth);
        dateObj.month = newMonth;
        dateObj.lastMonth = newMonth - 1;
        this.getDates(dateObj);
        return this.paintForm(dateObj);
    }

    //初始化日期表
    dateSelect.prototype.initTable = function() {
        var initTable = "<div class='dateSelectBox hideTable'><table class='dateSelect'><thead><tr class='select-head'>"
            + "<td colspan='7'><i class='reduceYear'></i>"
            + "<div class='yearSelect select-div'></div><input id='year-input' class='hidden date-input' type='text'/>"
            + "<i class='addYear'></i>"
            //+"<td></td>"
            + "<i class='reduceMonth'></i>"
            + "<div class='monthSelect select-div'></div><input id='month-input' class='hidden date-input' type='text'/>"
            + "<i class='addMonth'></i>"
            + "</td></tr></thead></table></div>";
        this.container = $(initTable);
        $(body).append(this.container);
        var table = this.container.find('.dateSelect');
        this.yearSelect = table.find('.yearSelect');
        this.yearInput = table.find('#year-input');
        this.monthSelect = table.find('.monthSelect');
        this.monthInput = table.find('#month-input');
        this.reduceYear = table.find('.reduceYear');
        this.reduceMonth = table.find('.reduceMonth');
        this.addYear = table.find('.addYear');
        this.addMonth = table.find('.addMonth');
        var selectRowHead = "<tr class='select-row-head'>";
        var selectRow = "<tr class='select-row'>";
        var selectTds;
        for (var i = 0; i < days.length; i++) {
            selectRowHead = selectRowHead + "<td><div>" + days[i] + "</div></td>";
            if (i == days.length - 1) {
                selectRowHead = selectRowHead + "</tr>";
                table.children().append(selectRowHead);
            }
        };
        for (var i = 0; i < 42; i++) {
            selectRow = selectRow + "<td class='select-able'><div></div></td>";
            if (i % 7 == 6) {
                selectRow = selectRow + "</tr>";
                table.append(selectRow);
                selectTds = table.find('.select-row')[Math.floor(i / 7)].children;
                this.childELes.push(selectTds);
                selectRow = "<tr class='select-row'>";
            };
        };
        //如果isFixed是true则不初始化确认和取消按钮
        if(!this.option.isFixed){
            var tfoot = "<tr><td colspan='3'><button class='dateComfirm'>确定</button></td><td></td><td colspan='3'><button class='dateCancel'>取消</button></td></tr>";
            table.append(tfoot);
            this.dateCancel = table.find('.dateCancel');
            this.dateComfirm = table.find('.dateComfirm');
        }
    };

    //初始化日期值
    dateSelect.prototype.initDate = function(date) {
        var dateTmp;
        if (!(dateTmp = isValidDate(date))) {
            dateTmp = new Date();
        }
        dateObj.year = dateTmp.getFullYear();
        dateObj.month = dateTmp.getMonth() + 1;
        dateObj.date = dateTmp.getDate();
        dateObj.day = dateTmp.getDay();
        dateObj.lastMonth = dateObj.month - 1;
        this.yearSelect.text(dateObj.year);
        this.monthSelect.text(dateObj.month);
        this.getDates(dateObj);
        return dateObj;
    };

    //根据日期值生成日历
    dateSelect.prototype.getDates = function(obj) {
        var dateShow = this.dateShow;
        var time = "", startTime, endTime, lastDate;
        var startDay, endDay, beforeStart, afterEnd;
        if (obj.year) {
            time = time + obj.year;
        };
        if (obj.month) {
            time = time + "-" + obj.month;
        };
        startTime = time + "-1";
        obj.endDate = getLastDayByMonth(obj.month, obj.year);
        lastDate = getLastDayByMonth(obj.lastMonth, obj.year);
        startDay = new Date(startTime).getDay();
        endDay = new Date(time + "-" + obj.endDate).getDay();
        beforeStart = startDay - 1;
        afterEnd = 14 - endDay - 1;
        for (var i = lastDate - beforeStart; i <= lastDate; i++) {
            dateShow[dateShow.length] = i;
        }
        for (var i = dateShow.length, j = 1; j <= obj.endDate; i++ , j++) {
            dateShow[i] = j;
        }
        var length = 42 - dateShow.length;
        for (var i = dateShow.length, j = 1; j <= length; i++ , j++) {
            dateShow[i] = j;
        }
    }

    //生成日历界面
    dateSelect.prototype.paintForm = function(obj) {
        var dateShow = this.dateShow;
        var before = dateShow.indexOf(1);
        var end = dateShow.lastIndexOf(obj.endDate);
        for (var i = 0; i < dateShow.length; i++) {
            var node = $(this.childELes[Math.floor(i / 7)][i % 7]);
            node.off('click');
            if (node.hasClass('selected')) {
                node.removeClass("selected");
            }
            if (node.hasClass("disabled")) {
                node.removeClass("disabled").addClass('select-able');
            }
            if (i < before || i > end) {
                $(node).addClass('disabled').removeClass('select-able').children().text(dateShow[i]);
                continue;
            }
            if (dateShow[i] == obj.date) {
                $(node).addClass("selected");
            }
            $(node).children().text(dateShow[i]);
            $(node).on("click", function () {
                ClickToSelect.call(this);
            });
        }
    };
    
    //根据parent获取obj的左偏值
    function offLeft(obj, parent) {
        var offLeft = obj.offset().left;
        var offparent = obj.parent();
        if (offparent.offset().left < offLeft) {
            offLeft = offLeft - offparent.offset().left;
        }
        return offLeft;
    }

    //根据parent获取obj的上偏值
    function offTop(obj, parent) {
        var offTop = obj.offset().top;
        var offparent = obj.parent();
        if (offparent.offset().top < offTop) {
            offTop = offTop - offparent.offset().top;
        }
        return offTop;
    }

    //校验并生成日期
    function isValidDate(date){
        if(!date || typeof date !== 'string')return new Date();
        var res = NumReg.exec(date);
        NumReg.lastIndex = 0;
        if(!res){
            var tmp = new Date(date);
            if(tmp !== 'Invalid Date')return tmp;
            return false;
        }else{
            if(res[2] !== res[4])return false;
        }
        var arr = date.split(res[2]);
        for(var i in arr){
            if(isNaN(arr[i]))return false;
        }
        if(res[2]=='')return new Date(res[1]+'-'+res[3]+'-'+res[5]);
        if(res[2]!=='-' && res[2]!=='/')return new Date(date.replace(new RegExp(res[2],'g'),'-'));
        return new Date(date);

    }

    //校验日期模板格式
    function initFormat(format){
        if(!format)return '-';
        var res = formatReg.exec(format);
        formatReg.lastIndex = 0;
        if(!res || res[1] !== res[2])return '-';
        return res[1];
    }

    //是否闰年
    function isGoodYear(year) {
        if (year % 4 == 0 || year % 400 == 0) {
            return true;
        }
        return false;
    }

    //获取当月最后一天
    function getLastDayByMonth(month, year) {
        if (bigMonths.indexOf(month) != -1) {
            return 31;
        };
        if (smallMonths.indexOf(month) != -1) {
            return 30;
        };
        if (specialMonth == month) {
            if (isGoodYear(year)) {
                return 29;
            } else {
                return 28;
            };
        };
    };

    //日期的点击处理函数
    function ClickToSelect(event) {
        var self = $(this);
        self.addClass("selected").siblings().removeClass("selected");
        self.parent().siblings().children().removeClass("selected");
        dateObj.date = self.children().text();
    };

    //阻止时间冒泡和捕获
    function stopTran(event) {
        var e = event || window.event;
        if (e && e.stopPropagation) {
            e.stopPropagation();
        }
        else if (e && e.preventDefault) {
            e.preventDefault();
        }
        else {
            e.cancelBubble = true;
        }
    }

},window)