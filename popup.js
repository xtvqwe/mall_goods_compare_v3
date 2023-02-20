/*
function xlsx_download(fileName,data){
    var str_data=""
    for(var i=0;i<data.length;i++){
        var line_str=data[i].join(",")+"\n"
        str_data+=line_str
    }
    const link = document.createElement('a');
    link.href = `data:text/xlsx;charset=utf-8,\ufeff${encodeURIComponent(str_data)}`;
    link.download = `${fileName}.xlsx`;
    document.body.appendChild(link)
    link.click();
    document.body.removeChild(link)
}
*/


var mybutton=document.getElementById("download")
mybutton.addEventListener("click",download)

var datalist=[]


function json_download(jfname,data){
    str_data=JSON.stringify(data)
    const link = document.createElement('a');
    link.href = `data:text/json;charset=utf-8,\ufeff${encodeURIComponent(str_data)}`;
    link.download = `${jfname}.json`;
    document.body.appendChild(link)
    link.click();
    document.body.removeChild(link)
}


function download(){
    //rqs_inf('')
    //xlsx_download('test',test_data1)
    //json_download('test',test_data1)
    chrome.cookies.getAll({
        url: 'https://supplier.newtvmall.ottcn.com/'
    }, function (cook) {
        var cks=false
        console.log(cook)
        for(var i=0;i<cook.length;i++){
            if(cook[i].domain==".newtvmall.ottcn.com"){
                cks=true
                var auth = 'Bearer '+cook[i]['value']
                rqs_inf(auth,0)
            }
        }
        if(!cks){
            document.getElementById("show").innerText="请先登录网选后台!"
        }
    });
}



function rqs_inf(cookie,pn){
    var url='https://supplierbff.newtvmall.ottcn.com/goods/spus'
    var payload={
        "likeGoodsName": "",
        "likeProviderName": "京东供应商",
        "likeGoodsInfoNo": "",
        "likeGoodsNo": "",
        "pageNum": pn,
        "pageSize": 100,
        "auditStatus": 1,
        "addedFlag":"1",
        "sortRole": ""
    }

    var xmlhttp;
    if (window.XMLHttpRequest) {
        // IE7+, Firefox, Chrome, Opera, Safari 浏览器执行代码
        xmlhttp = new XMLHttpRequest();
    }
    else {
        // IE6, IE5 浏览器执行代码
        xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
    }
    xmlhttp.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            //console.log(JSON.parse(this.responseText))
            get_total_items(cookie,JSON.parse(this.responseText))
        }
    }
    xmlhttp.open("POST", url, true);
    xmlhttp.setRequestHeader("Content-type", "application/json;charset=UTF-8");
    xmlhttp.setRequestHeader("Authorization", cookie);
    xmlhttp.send(JSON.stringify(payload));
}

function get_total_items(cookie,fp_data){
    var goodspage=fp_data["context"]["goodsPage"]
    var all_pages= goodspage["totalPages"]
    var num=goodspage["number"]
    var goods=goodspage["content"]
    var goodinfs=fp_data["context"]["goodsInfoList"]
    for(var i=0;i<goods.length;i++){
        var good=goods[i]
        var goodIs=good["goodsInfoIds"]
        for(var j=0;j<goodIs.length;j++){
            var goodinf=goodIs[j]
            for(var k=0;k<goodinfs.length;k++){
                var goodInfo=goodinfs[k]
                if(goodinf==goodInfo["goodsInfoId"]){
                    item={
                        '商品名称': goodInfo['goodsInfoName'],
                        '商品副标题': good['goodsSubtitle'],
                        '平台sku编码': goodInfo['goodsInfoNo'],
                        '三方平台skuId': goodInfo['thirdPlatformSkuId'],
                        '供货价': goodInfo['supplyPrice'],
                        '市场价': goodInfo['marketPrice'],
                        '供应商名称': '京东供应商',
                        '上架时间': goodInfo['addedTime'],
                        '0不可售，1可售': goodInfo['addedFlag']
                    }
                    datalist.push(item)
                    break
                }
            }
        }
    }

    if(!fp_data["context"]["goodsPage"]["last"]){
        pn=num+=1
        process_show(pn,all_pages)
        rqs_inf(cookie,pn)
    }
    else{       
        var now=new Date()
        var dtl=now.toString().split(" ")
        var dt=dtl[3]+"_"+dtl[1]+"_"+dtl[2]
        json_download("京东商品下载_"+dt,datalist)
        //xlsx_download(fileName,data)
    }
   
}

function process_show(pn,all_pages){
    var show_area=document.getElementById("show")
    var lp=all_pages-1
    show_area.innerText =pn+"/"+lp
}

//详情页子商品实时爬虫

function realtime_spider(){
    chrome.cookies.getAll({
        url: 'https://supplier.newtvmall.ottcn.com/'
    }, function (cook) {
        var cks=false
        for(var i=0;i<cook.length;i++){
            if(cook[i].domain==".newtvmall.ottcn.com"){
                cks=true
                var auth = 'Bearer '+cook[i]['value']
                get_spu(auth)
            }
        }
        if(!cks){
            document.getElementById("show").innerText="请先登录网选后台!"
        }
    });
}

function get_spu(auth){
    var detail_urls=["https://supplier.newtvmall.ottcn.com/goods-edit/","https://supplier.newtvmall.ottcn.com/goods-check-edit/"]
    chrome.tabs.query({active:true},function(tab) { 
        var tablink = tab[0].url;
        for(var i=0;i<detail_urls.length;i++){
            var detail_url=detail_urls[i]
            if(tablink.substring(0,detail_url.length)==detail_url){
                var spu=tablink.replace(detail_url,"").split("/")[0]
                get_detail_api(spu,auth)
                break
            }
        }
    }); 
}

function get_detail_api(spu,auth){
    var url="https://supplierbff.newtvmall.ottcn.com/goods/spu/"+spu
    var xmlhttp;
    if (window.XMLHttpRequest) {
        // IE7+, Firefox, Chrome, Opera, Safari 浏览器执行代码
        xmlhttp = new XMLHttpRequest();
    }
    else {
        // IE6, IE5 浏览器执行代码
        xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
    }
    xmlhttp.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            get_jd_skus(JSON.parse(this.responseText))
            //console.log(JSON.parse(this.responseText))
        }
    }
    xmlhttp.open("GET", url, true);
    xmlhttp.setRequestHeader("Authorization", auth);
    xmlhttp.send()
}


function get_jd_skus(data){
    var skus=[]
    var skus2=[]
    var prices=[]
    var stocks=[]
    var plat=data["context"]["goods"]["providerName"]
    if(plat=="京东供应商"){
        var goodInfs=data["context"]["goodsInfos"]
        for(var i=0;i<goodInfs.length;i++){
            var goodInf=goodInfs[i]
            var stockStatus;
            if(goodInf["addedFlag"]==1){
                stockStatus="可售"
            }
            else{
                stockStatus="不可售"
            }
            skus.push("J_"+goodInf["thirdPlatformSkuId"])
            skus2.push(goodInf["thirdPlatformSkuId"])
            prices.push([goodInf["thirdPlatformSkuId"],goodInf["marketPrice"]])
            stocks.push([goodInf["thirdPlatformSkuId"],stockStatus])
        }
    }

    var p_url="https://fts.jd.com/prices/mgets?source=pc-item&skuIds="+skus.join(",")
    compare_rqs(p_url,prices,"p")
    var s_url="https://cd.jd.com/stocks?type=getstocks&area=1_2802_54745_0&skuIds="+skus2.join(",")
    compare_rqs(s_url,stocks,"s")
}

function compare_rqs(url,mlist,t){
    var xmlhttp;
    if (window.XMLHttpRequest) {
        // IE7+, Firefox, Chrome, Opera, Safari 浏览器执行代码
        xmlhttp = new XMLHttpRequest();
    }
    else {
        // IE6, IE5 浏览器执行代码
        xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
    }
    xmlhttp.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            //console.log(JSON.parse(this.responseText))
            render_compare(mlist,JSON.parse(this.responseText),t)
        }
    }
    xmlhttp.open("GET", url, true);
    //xmlhttp.setRequestHeader("Referer", "https://www.jd.com/");
    xmlhttp.send()
}

function render_compare(mlist,res,t){
    var eleid="show_"+t
    var pele=document.getElementById(eleid)
    var query="<table>";
    if(t=="p"){
        query+="<tr><th>京东sku</th><th>网选价格</th><th>京东价格</th></tr>"
    }
    if(t=="s"){
        query+="<tr><th>京东sku</th><th>网选状态</th><th>京东状态</th></tr>"
    }
    for(var i=0;i<mlist.length;i++){
        var sku=mlist[i][0]
        var line_data=[sku,mlist[i][1]]
        if(t=="p"){
            for(var j=0;j<res.length;j++){
                if(sku==res[j]["id"].replace("J_","")){
                    line_data.push(res[j]["p"])
                    query+="<tr><td>"+sku+"</td><td>"+mlist[i][1]+"</td><td>"+res[j]["p"]+"</td></tr>"
                    break
                }
            }
        }
        if(t=="s"){
            line_data.push(res[sku]["StockStateName"])
            query+="<tr><td>"+sku+"</td><td>"+mlist[i][1]+"</td><td>"+res[sku]["StockStateName"]+"</td></tr>"
        }
    }
    query+="</table>"
    pele.innerHTML=query
}


realtime_spider();