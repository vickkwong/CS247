// Initial code by Borui Wang, updated by Graham Roth
// For CS247, Spring 2014

(function() {

  var cur_video_blob = null;
  var fb_instance;
  var is_recording = false;
  var mediaRecorder;
  var fb_instance_stream;
  var my_color;
  var username;
  var vidCounter = 0;
  var responseString;
  var is_response = false;

  $(document).ready(function(){
    connect_to_chat_firebase();
    connect_webcam();
  });

  function connect_to_chat_firebase(){
    /* Include your Firebase link here!*/
    fb_instance = new Firebase("https://vkwong-cs247-p3.firebaseio.com");

    // generate new chatroom id or use existing id
    var url_segments = document.location.href.split("/#");
    if(url_segments[1]){
      fb_chat_room_id = url_segments[1];
    }else{
      fb_chat_room_id = Math.random().toString(36).substring(7);
    }
    display_msg({m:"Share this url with your friend to join this chat: "+ document.location.origin+"/#"+fb_chat_room_id,c:"red"})

    // set up variables to access firebase data structure
    var fb_new_chat_room = fb_instance.child('chatrooms').child(fb_chat_room_id);
    var fb_instance_users = fb_new_chat_room.child('users');
    fb_instance_stream = fb_new_chat_room.child('stream');
    my_color = "#"+((1<<24)*Math.random()|0).toString(16);

    // listen to events
    fb_instance_users.on("child_added",function(snapshot){
      display_msg({m:snapshot.val().name+" joined the room",c: snapshot.val().c});
    });
    fb_instance_stream.on("child_added",function(snapshot){
      display_msg(snapshot.val());
    });

    // block until username is answered
    username = window.prompt("Welcome, warrior! please declare your name?");
    if(!username){
      username = "anonymous"+Math.floor(Math.random()*1111);
    }
    fb_instance_users.push({ name: username,c: my_color});
    permissiontToRecord = window.confirm("By using this app, you are granting permission to automatically record your responses");
    if (permissiontToRecord)
      $("#waiting").remove();
    else
      permissiontToRecord = window.confirm("Too bad. You can't use our app then. Rethink it? By using this app, you are granting permission to automatically record your responses");

    // bind submission box
    $("#submission input").mousedown(function( event ) {
      if (!is_recording) {
        is_recording = true;
        // $(this).after("is_recording");
        $(this).css('background-color', 'red');
        mediaRecorder.start(1000000);
      } else {
        mediaRecorder.stop();
        // $(this).after("stopped recording");
        is_recording = false;
        $(this).css('background-color', '#32cd32');
      }
    });

    $("#conversation video").mouseenter(function( event ) {
      console.log("controls clicking");
    });

    // scroll to bottom in case there is already content
    scroll_to_bottom(1300);
  }

  // creates a message node and appends it to the conversation
  function display_msg(data){
    $("#conversation").append("<div class='msg' style='color:"+data.c+"'>"+data.m+"</div>");

    if(data.v){

      // console.log(data.c.toString());
      // console.log(my_color.toString());
      // for video element
      vidCounter = vidCounter + 1;
      var video = document.createElement("video");
      video.setAttribute("id", "video" + vidCounter + "color" + data.c);
      // video.setAttribute("poster", "http://tetris.kadwill.com/play_button.png");
      video.autoplay = false;
      // video.controls = true; // optional
      video.loop = false;
      video.width = 360;



      var source = document.createElement("source");
      source.src =  URL.createObjectURL(base64_to_blob(data.v));
      source.type =  "video/webm";

      video.appendChild(source);

      // for gif instead, use this code below and change mediaRecorder.mimeType in onMediaSuccess below
      // var video = document.createElement("img");
      // video.src = URL.createObjectURL(base64_to_blob(data.v));
      var videoDiv = document.createElement("div");
      videoDiv.setAttribute("class", "videoDiv");
      videoDiv.setAttribute("id", "videoNo" + vidCounter);

      // document.getElementById("converation").appendChild()
      videoDiv.appendChild(video);

      var playPauseButton = document.createElement("input");
      playPauseButton.setAttribute("type", "image");
      playPauseButton.setAttribute("src", "http://tetris.kadwill.com/play_button.png");
      playPauseButton.setAttribute("class", "playPauseButton");
      // playPauseButton.innerHTML = "Play"; 
      playPauseButton.setAttribute("id", "videoPlayButton" + vidCounter);
      // playPauseButton.setAttribute("class", "playPause");
      playPauseButton.onclick = function() {
        // console.log($(this).attr('id'));
        var currentVidNo = $(this).attr('id').substring(15);
        var vidID = "video" + currentVidNo + "color" + data.c; 
        // console.log(vidID);
        var myVideo=document.getElementById(vidID); 
        if (data.c.toString().localeCompare(my_color.toString()) != 0) {
          // console.log("this is NOT my video");
          if (myVideo.paused) {
            myVideo.play(); 
            is_recording = true;
            mediaRecorder.start(1000000);
            $("#record_button").css('background-color', 'red');
            $("#record_button").attr('disabled', 'disabled');
            $(this).css('visibility', 'hidden');
            responseString = "response to <a href=\"#videoNo" + currentVidNo + "\">Video No." + currentVidNo + "</a>";
            is_response = true;
          }
        } else {
          // console.log("this is my video");
          if (myVideo.paused) {
            myVideo.play(); 
            $(this).css('visibility', 'hidden');
          } else {
            myVideo.pause();
          }
        } 

        myVideo.addEventListener("ended", function(){ 
          // console.log("end video"); 
          $("#record_button").removeAttr('disabled');
          if (data.c.toString().localeCompare(my_color.toString()) == 0) {
            // console.log("let me repeat video");
            $("#videoPlayButton" + currentVidNo).css('visibility', 'visible');
          } else {
            console.log("IN HERE");
            $("#viewedButton" + currentVidNo).css('visibility', 'visible');
          }
        });

      }

      var viewButton = document.createElement("input");
      viewButton.setAttribute("type", "button");
      viewButton.setAttribute("class", "viewedButton");
      viewButton.setAttribute("id", "viewedButton" + vidCounter);
      viewButton.setAttribute("value", "VIEWED");
     
      videoDiv.appendChild(playPauseButton);
      videoDiv.appendChild(viewButton);
      document.getElementById("conversation").appendChild(videoDiv);
      // document.getElementById(playPauseButton.getAttribute('id')).appendChild(playPauseImage);
    }
  }

  function scroll_to_bottom(wait_time){
    // scroll to bottom of div
    setTimeout(function(){
      $("html, body").animate({ scrollTop: $(document).height() }, 200);
    },wait_time);
  }

  function connect_webcam(){
    // we're only recording video, not audio
    var mediaConstraints = {
      video: true,
      audio: true
    };

    // callback for when we get video stream from user.
    var onMediaSuccess = function(stream) {
      // create video element, attach webcam stream to video element
      var video_width= 160;
      var video_height= 120;
      var webcam_stream = document.getElementById('webcam_stream');
      var video = document.createElement('video');
      webcam_stream.innerHTML = "";
      // adds these properties to the video
      video = mergeProps(video, {
          controls: false,
          width: video_width,
          height: video_height,
          src: URL.createObjectURL(stream)
      });
      video.play();
      webcam_stream.appendChild(video);

      // counter
      var time = 0;
      var second_counter = document.getElementById('second_counter');
      var second_counter_update = setInterval(function(){
        second_counter.innerHTML = time++;
      },1000);

      // now record stream in 5 seconds interval
      var video_container = document.getElementById('video_container');
      mediaRecorder = new MediaStreamRecorder(stream);
      var index = 1;

      mediaRecorder.mimeType = 'video/webm';
      // mediaRecorder.mimeType = 'image/gif';
      // make recorded media smaller to save some traffic (80 * 60 pixels, 3*24 frames)
      mediaRecorder.video_width = video_width/2;
      mediaRecorder.video_height = video_height/2;

      var isready = false;
      mediaRecorder.ondataavailable = function (blob) {
          // console.log("new data available!");
          video_container.innerHTML = "";

          // convert data into base 64 blocks
          blob_to_base64(blob,function(b64_data){
            cur_video_blob = b64_data;
            console.log('ondataavailable..', blob);
            var tempVidCounter = vidCounter + 1;
            if (is_response) {
              fb_instance_stream.push({m:username+" sent Video No." + tempVidCounter + " as a "+ responseString, v:cur_video_blob, c: my_color});
            } else {
              fb_instance_stream.push({m:username+" sent Video No." + tempVidCounter, v:cur_video_blob, c: my_color});
            }
          });
          // console.log("trying to push");
      };
      // setInterval( function() {
      //   mediaRecorder.stop();
      //   mediaRecorder.start(3000);
      // }, 3000 );
      // console.log("connect to media stream!");
    }

    // callback if there is an error when we try and get the video stream
    var onMediaError = function(e) {
      console.error('media error', e);
    }

    // get video stream from user. see https://github.com/streamproc/MediaStreamRecorder
    navigator.getUserMedia(mediaConstraints, onMediaSuccess, onMediaError);
  }

  // check to see if a message qualifies to be replaced with video.
  var has_emotions = function(msg){
    var options = ["lol",":)",":("];
    for(var i=0;i<options.length;i++){
      if(msg.indexOf(options[i])!= -1){
        return true;
      }
    }
    return false;
  }


  // some handy methods for converting blob to base 64 and vice versa
  // for performance bench mark, please refer to http://jsperf.com/blob-base64-conversion/5
  // note useing String.fromCharCode.apply can cause callstack error
  var blob_to_base64 = function(blob, callback) {
    var reader = new FileReader();
    reader.onload = function() {
      var dataUrl = reader.result;
      var base64 = dataUrl.split(',')[1];
      callback(base64);
    };
    reader.readAsDataURL(blob);
  };

  var base64_to_blob = function(base64) {
    var binary = atob(base64);
    var len = binary.length;
    var buffer = new ArrayBuffer(len);
    var view = new Uint8Array(buffer);
    for (var i = 0; i < len; i++) {
      view[i] = binary.charCodeAt(i);
    }
    var blob = new Blob([view]);
    return blob;
  };

})();
