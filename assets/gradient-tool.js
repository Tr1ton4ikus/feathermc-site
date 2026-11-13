(() => {
 'use strict';
 const textInput=document.getElementById('txt');
 const first=document.getElementById('c1');
 const last=document.getElementById('c2');
 const hexOutput=document.getElementById('code');
 const miniOutput=document.getElementById('mm');
 const preview=document.getElementById('preview');
 const status=document.getElementById('msg');
 const escapeMiniMessage=text=>text.replace(/\\/g,'\\\\').replace(/</g,'\\<');
 const make=()=>{
  const text=textInput.value || 'FeatherMC';
  preview.textContent=text;
  preview.style.backgroundImage=`linear-gradient(90deg,${first.value},${last.value})`;
  const rgb=color=>[1,3,5].map(index=>parseInt(color.slice(index,index+2),16));
  const start=rgb(first.value),end=rgb(last.value);
  const chars=typeof Intl.Segmenter==='function'?[...new Intl.Segmenter('ru',{granularity:'grapheme'}).segment(text)].map(part=>part.segment):Array.from(text);
  hexOutput.textContent=chars.map((char,index)=>{
   const amount=chars.length===1?0:index/(chars.length-1);
   const color=start.map((value,channel)=>Math.round(value+(end[channel]-value)*amount).toString(16).padStart(2,'0')).join('').toUpperCase();
   return `&#${color}${char}`;
  }).join('');
  miniOutput.textContent=`<gradient:${first.value}:${last.value}>${escapeMiniMessage(text)}</gradient>`;
  status.textContent='';
 };
 [textInput,first,last].forEach(input=>input.addEventListener('input',make));make();
 document.querySelectorAll('[data-copy]').forEach(button=>button.addEventListener('click',async()=>{
  const output=document.getElementById(button.dataset.copy);
  try{await navigator.clipboard.writeText(output.textContent);status.textContent='Код скопирован';}
  catch(error){
   const range=document.createRange();range.selectNodeContents(output);
   const selection=window.getSelection();selection.removeAllRanges();selection.addRange(range);
   output.focus();status.textContent='Не удалось скопировать автоматически. Код выделен: нажмите Ctrl+C или скопируйте через меню.';
  }
 }));
})();
