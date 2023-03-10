function I(id){return document.getElementById(id);}
    var meterBk="#E0E0E0";
    var dlColor="#40fd14",
      ulColor="#40fd14",
      pingColor="#AA6060",
      jitColor="#AA6060";
    var progColor="#40fd14";
    var parameters={ //custom test parameters. See doc.md for a complete list
      time_dl: 5, //download test lasts 10 seconds
      time_ul: 5, //upload test lasts 10 seconds
      count_ping: 50, //ping+jitter test does 20 pings
      getIp_ispInfo: false //will only get IP address without ISP info
    };
    
    //CODE FOR GAUGES
    function drawMeter(c,amount,bk,fg,progress,prog){
      var ctx=c.getContext("2d");
      var dp=window.devicePixelRatio||1;
      var cw=c.clientWidth*dp, ch=c.clientHeight*dp;
      var sizScale=ch*0.0055;
      if(c.width==cw&&c.height==ch){
        ctx.clearRect(0,0,cw,ch);
      }else{
        c.width=cw;
        c.height=ch;
      }
      ctx.beginPath();
      ctx.strokeStyle=bk;
      ctx.lineWidth=16*sizScale;
      ctx.arc(c.width/2,c.height-58*sizScale,c.height/1.8-ctx.lineWidth,-Math.PI*1.1,Math.PI*0.1);
      ctx.stroke();
      ctx.beginPath();
      ctx.strokeStyle=fg;
      ctx.lineWidth=16*sizScale;
      ctx.arc(c.width/2,c.height-58*sizScale,c.height/1.8-ctx.lineWidth,-Math.PI*1.1,amount*Math.PI*1.2-Math.PI*1.1);
      ctx.stroke();
      if(typeof progress !== "undefined"){
        ctx.fillStyle=prog;
        ctx.fillRect(c.width*0.3,c.height-16*sizScale,c.width*0.4*progress,4*sizScale);
      }
    }
    function mbpsToAmount(s){
      return 1-(1/(Math.pow(1.3,Math.sqrt(s))));
    }
    function msToAmount(s){
      return 1-(1/(Math.pow(1.08,Math.sqrt(s))));
    }
    
    //SPEEDTEST AND UI CODE
    var w=null; //speedtest worker
    var data=null; //data from worker
    function startStop(){
      if(w!=null){
        //speedtest is running, abort
        w.postMessage('abort');
        w=null;
        data=null;
        I("startStopBtn").className="";
        initUI();
      }else{
        //test is not running, begin
        w=new Worker('speedtest_worker.min.js');
        w.postMessage('start'); //Add optional parameters as a JSON object to this command
        I("startStopBtn").className="running";
        w.onmessage=function(e){
          data=e.data.split(';');
          var status=Number(data[0]);
          if(status>=4){
            //test completed
            I("startStopBtn").className="";
            w=null;
            updateUI(true);
          }
        };
      }
    }
    //this function reads the data sent back by the worker and updates the UI
    function updateUI(forced){
      if(!forced&&(!data||!w)) return;
      var status=Number(data[0]);
      I("dlText").textContent=(status==1&&data[1]==0)?"...":data[1];
      drawMeter(I("dlMeter"),mbpsToAmount(Number(data[1]*(status==1?oscillate():1))),meterBk,dlColor,Number(data[6]),progColor);
      I("ulText").textContent=(status==3&&data[2]==0)?"...":data[2];
      drawMeter(I("ulMeter"),mbpsToAmount(Number(data[2]*(status==3?oscillate():1))),meterBk,ulColor,Number(data[7]),progColor);
      I("pingText").textContent=data[3];
      drawMeter(I("pingMeter"),msToAmount(Number(data[3]*(status==2?oscillate():1))),meterBk,pingColor,Number(data[8]),progColor);
      I("jitText").textContent=data[5];
      drawMeter(I("jitMeter"),msToAmount(Number(data[5]*(status==2?oscillate():1))),meterBk,jitColor,Number(data[8]),progColor);

    }
    function oscillate(){
      return 1+0.02*Math.sin(Date.now()/100);
    }
    //poll the status from the worker (this will call updateUI)
    setInterval(function(){
      if(w) w.postMessage('status');
    },200);
    //update the UI every frame
    window.requestAnimationFrame=window.requestAnimationFrame||window.webkitRequestAnimationFrame||window.mozRequestAnimationFrame||window.msRequestAnimationFrame||(function(callback,element){setTimeout(callback,1000/60);});
    function frame(){
      requestAnimationFrame(frame);
      updateUI();
    }
    frame(); //start frame loop
    //function to (re)initialize UI
    function initUI(){
      drawMeter(I("dlMeter"),0,meterBk,dlColor,0);
      drawMeter(I("ulMeter"),0,meterBk,ulColor,0);
      drawMeter(I("pingMeter"),0,meterBk,pingColor,0);
      drawMeter(I("jitMeter"),0,meterBk,jitColor,0);
      I("dlText").textContent="";
      I("ulText").textContent="";
      I("pingText").textContent="";
      I("jitText").textContent="";
    
    }
