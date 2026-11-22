const $=id=>document.getElementById(id);
let subject="Mixed science",sessionMinutes=30,remaining=1800,timer=null,questions=0,elapsedSeconds=0,lastSuggested="",tabStream=null;
const capturedHolder=document.createElement("input");capturedHolder.type="hidden";capturedHolder.id="capturedFrame";document.body.appendChild(capturedHolder);
document.querySelectorAll(".subject").forEach(btn=>btn.addEventListener("click",()=>{document.querySelectorAll(".subject").forEach(b=>b.classList.remove("selected"));btn.classList.add("selected");subject=btn.dataset.subject;}));
function drawTimer(){const m=Math.floor(remaining/60),s=remaining%60;$("clock").textContent=`${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;$("timerProgress").style.width=`${(1-remaining/(sessionMinutes*60))*100}%`;$("timerLabel").textContent=timer?"Session in progress":remaining===0?"Session complete":"Ready when you are";$("elapsed").textContent=`${Math.floor(elapsedSeconds/60)} / ${sessionMinutes} min`;$("minutesDone").textContent=`${Math.floor(elapsedSeconds/60)} min`;$("timerTitle").textContent=`${sessionMinutes}-minute ${sessionMinutes===1?"sprint":"study session"}`;$("sessionLengthLabel").textContent=sessionMinutes===120?"2 hours":`${sessionMinutes} ${sessionMinutes===1?"minute":"minutes"}`;$("sessionLength").disabled=!!timer;$("start").textContent=timer?"Session running":remaining===0?"Start again":"Start session";}
$("sessionLength").addEventListener("input",e=>{if(timer)return;sessionMinutes=Number(e.target.value);remaining=sessionMinutes*60;elapsedSeconds=0;drawTimer();});
$("start").onclick=()=>{if(timer)return;if(remaining===0){remaining=sessionMinutes*60;elapsedSeconds=0;}timer=setInterval(()=>{remaining=Math.max(0,remaining-1);elapsedSeconds++;drawTimer();if(!remaining){clearInterval(timer);timer=null;drawTimer();}},1000);drawTimer();};
$("reset").onclick=()=>{if(timer)clearInterval(timer);timer=null;remaining=sessionMinutes*60;elapsedSeconds=0;drawTimer();};drawTimer();
$("image").addEventListener("change",()=>{$("fileName").textContent=$("image").files[0]?.name||"No screenshot selected";});

const connectBtn=$("connectTab"),captureBtn=$("captureTab"),stopBtn=$("stopShare"),preview=$("tabPreview");
function setShareState(on,message){
 $("shareDot").classList.toggle("on",on);
 $("shareStatus").textContent=message;
 captureBtn.disabled=!on;stopBtn.disabled=!on;
}
connectBtn.addEventListener("click",async()=>{
 if(!navigator.mediaDevices?.getDisplayMedia){setShareState(false,"Tab sharing is not supported in this browser. Use desktop Edge or Chrome.");return;}
 try{
  if(tabStream)tabStream.getTracks().forEach(t=>t.stop());
  // Edge and Chrome require a user gesture and explicit user selection for screen/tab capture.
  tabStream=await navigator.mediaDevices.getDisplayMedia({video:{frameRate:5},audio:false});
  preview.srcObject=tabStream;preview.classList.remove("hidden");
  const track=tabStream.getVideoTracks()[0];
  track.addEventListener("ended",()=>{tabStream=null;preview.srcObject=null;preview.classList.add("hidden");setShareState(false,"Sharing stopped.");});
  setShareState(true,"Connected. Switch to the Sparx tab in the share picker, then click Read current question.");
 }catch(e){setShareState(false,e.name==="NotAllowedError"?"Tab sharing was cancelled. You can try again when ready.":e.message);}
});
stopBtn.addEventListener("click",()=>{
 if(tabStream)tabStream.getTracks().forEach(t=>t.stop());
 tabStream=null;preview.srcObject=null;preview.classList.add("hidden");
 setShareState(false,"Sharing stopped.");
});
captureBtn.addEventListener("click",async()=>{
 if(!tabStream){setShareState(false,"Connect to a Sparx tab first.");return;}
 try{
  const track=tabStream.getVideoTracks()[0];
  const frame=new ImageCapture(track);
  const bitmap=await frame.grabFrame();
  const canvas=document.createElement("canvas");
  canvas.width=bitmap.width;canvas.height=bitmap.height;
  canvas.getContext("2d").drawImage(bitmap,0,0);
  const data=canvas.toDataURL("image/jpeg",0.88);
  $("capturedFrame").value=data;
  $("status").textContent="Sparx tab frame captured. Click Explain with AI to read it.";
  $("shareStatus").textContent="Question view captured. You can capture another view whenever you move to the next question.";
 }catch(e){
  // Fallback for browsers that do not expose ImageCapture.
  try{
   const video=preview;
   if(!video.videoWidth)throw e;
   const canvas=document.createElement("canvas");canvas.width=video.videoWidth;canvas.height=video.videoHeight;
   canvas.getContext("2d").drawImage(video,0,0);
   $("capturedFrame").value=canvas.toDataURL("image/jpeg",0.88);
   $("status").textContent="Sparx tab frame captured. Click Explain with AI to read it.";
  }catch(err){$("status").textContent="Couldn't capture the tab frame. Try reconnecting and selecting the Sparx tab.";}
 }
});

function extractSuggested(text){const m=text.match(/(?:Suggested answer|Answer to enter)\s*[:\-]\s*([\s\S]*?)(?=\n(?:Quick check|Common mistake|Check yourself)\b|$)/i);return m?.[1]?.trim()||text;}
$("solve").onclick=async()=>{
 const question=$("question").value.trim(),file=$("image").files[0],tabImage=$("capturedFrame").value;
 if(!question&&!file&&!tabImage){$("status").textContent="Connect to a Sparx tab and capture the question, paste text, or upload a screenshot.";return;}
 $("solve").disabled=true;$("solve").textContent="Working…";$("status").textContent="SparxMate is thinking through the science question…";
 try{
  let imageData=null;
  if(tabImage){imageData=tabImage;}
  else if(file){if(file.size>8*1024*1024)throw new Error("Please use an image smaller than 8 MB.");imageData=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(file);});}
  const response=await fetch("/api/solve",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({question,subject,level:$("level").value,mode:$("helpMode").value,imageData})});
  const data=await response.json();if(!response.ok)throw new Error(data.error||"Something went wrong.");
  $("answer").classList.add("hidden");$("result").classList.remove("hidden");$("answerText").textContent=data.answer;lastSuggested=data.suggestedAnswer||extractSuggested(data.answer);$("suggested").textContent=lastSuggested;$("status").textContent="Explanation ready. Review the answer before using it.";questions++;$("count").textContent=questions;
 }catch(e){$("status").textContent=e.message;}
 finally{$("solve").disabled=false;$("solve").textContent="✦ Explain with AI";}
};
$("copy").onclick=async()=>{if(!lastSuggested)return;try{await navigator.clipboard.writeText(lastSuggested);$("status").textContent="Suggested answer copied to clipboard.";}catch{$("status").textContent="Clipboard unavailable. Select and copy the suggested answer.";}};