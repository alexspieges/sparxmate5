import "dotenv/config";
import express from "express";
import OpenAI from "openai";
import path from "node:path";
import {fileURLToPath} from "node:url";

const app=express();
const here=path.dirname(fileURLToPath(import.meta.url));
const client=process.env.OPENAI_API_KEY?new OpenAI({apiKey:process.env.OPENAI_API_KEY}):null;
app.use(express.json({limit:"12mb"}));
app.use(express.static(path.join(here,"public")));
app.get("/api/health",(_req,res)=>res.json({ok:true,configured:!!client}));
app.post("/api/solve",async(req,res)=>{
 try{
  if(!client)return res.status(503).json({error:"The AI is not configured yet. Add your API key to the .env file and restart the website."});
  const {question="",subject="Mixed science",level="GCSE Year 10",mode="Explain step by step",imageData}=req.body||{};
  if(typeof question!=="string"||question.length>10000)return res.status(400).json({error:"Question text is invalid or too long."});
  const content=[];
  content.push({type:"input_text",text:`Subject: ${subject}\nLevel: ${level}\nHelp style: ${mode}\n\nQuestion or extra context:\n${question||"(Please read the attached screenshot and identify the science question.)"}`});
  if(imageData){
   if(typeof imageData!=="string"||!/^data:image\/(png|jpeg|webp);base64,/.test(imageData))return res.status(400).json({error:"Please upload a PNG, JPG or WEBP image."});
   content.push({type:"input_image",image_url:imageData,detail:"high"});
  }
  const response=await client.responses.create({
   model:process.env.OPENAI_MODEL||"gpt-5.5",
   instructions:"You are SparxMate, a friendly GCSE science tutor. Read the attached question image if supplied. If the image is unclear, say exactly what is unreadable rather than inventing details. Give a clear explanation at the stated school level. Use headings: What the question is asking; Step-by-step explanation; Suggested answer; Quick check. For calculations show formula, substitution, units and final answer. For multiple choice, explain why the selected option is correct. If the student asked for a hint, give a hint without revealing the full answer. Keep the suggested answer concise and scientifically accurate. The student must review and submit their own work.",
   input:[{role:"user",content}]
  });
  const answer=response.output_text||"I couldn't produce an explanation. Try a clearer screenshot or paste the question.";
  const match=answer.match(/Suggested answer\s*[:\-]?\s*([\s\S]*?)(?=\n(?:Quick check|$))/i);
  res.json({answer,suggestedAnswer:match?.[1]?.trim()||answer});
 }catch(error){console.error(error);res.status(500).json({error:"AI request failed. Check your API key, model setting and internet connection."});}
});
const port=Number(process.env.PORT||3210);
app.listen(port,"127.0.0.1",()=>console.log(`SparxMate website running at http://localhost:${port}`));