"use strict";

const {readFileSync, writeFileSync} = require("node:fs");
const {join} = require("node:path");

const baseVersion = "1.12.276";
const baseSequence = 382;

function replaceOnce(source, before, after, label) {
  const start = source.indexOf(before);
  if (start < 0 || start !== source.lastIndexOf(before)) {
    throw Error("Não encontrei o trecho único para " + label + ".");
  }
  return source.slice(0, start) + after + source.slice(start + before.length);
}

function editScript(index, id, edit) {
  const tag = '<script id="' + id + '">';
  const start = index.indexOf(tag);
  if (start < 0 || start !== index.lastIndexOf(tag)) throw Error("Script único ausente: " + id);
  const end = index.indexOf("</script>", start + tag.length);
  if (end < 0) throw Error("Final do script ausente: " + id);
  return index.slice(0, start + tag.length)
    + edit(index.slice(start + tag.length, end))
    + index.slice(end);
}

function addAccountAccess(script) {
  const anchor = "registrationSdk:async()=>{";
  const access = [
    "muralSdk:async()=>{",
    "  await I();",
    "  const uid=r.auth.currentUser?.uid;",
    '  if(!uid||s?.uid!==uid)throw Error("Entre com sua conta para abrir o mural.");',
    '  if(A())return {sdk:r,uid,professorId:a,role:"teacher"};',
    "  const context=window.__AP_STUDENT_CONTEXT,profile=s.profile;",
    '  if(s.role!=="student"||context?.role!=="student"||context.storageId!==uid||profile?.ativo!==true||profile.perfil!=="aluno"||profile.professorId!==a)throw Error("O mural é para alunos aprovados da turma.");',
    '  return {sdk:r,uid,professorId:a,role:"student",nome:profile.nome};',
    "},"
  ].join("\n");
  return replaceOnce(script, anchor, access + anchor, "acesso da turma");
}

function addReceiptShare(script) {
  const confirmation = 'return c=null,k(),f(),void("function"==typeof toast&&toast("Feedback enviado ao professor."));';
  const receipt = '<div id="apFeedbackReceipt" class="ap-feedback-receipt" hidden></div>';
  const visibility = 'a("apFeedbackReceipt").hidden=!r.response,';
  const refresh = 'a("apFeedbackStudentRefresh").onclick=()=>t.refresh(),';
  script = replaceOnce(script, confirmation,
    '{c=null;f();if(typeof toast==="function")toast("Feedback enviado ao professor.");}', "confirmação de feedback");
  script = replaceOnce(script, receipt, receipt
    + '<button type="button" class="ap-mural-share" id="apFeedbackShareMural" hidden>Compartilhar no Mural</button>',
    "botão no comprovante");
  script = replaceOnce(script, visibility, visibility
    + 'a("apFeedbackShareMural").hidden=!r.response||window.APaccounts?.context()?.role!=="student"||!window.APMural,',
    "visibilidade no comprovante");
  return replaceOnce(script, refresh, refresh + [
    'a("apFeedbackShareMural").onclick=()=>{',
    "  if(!p.open||!d||d!==t.uid())return;",
    "  const response=t.items().find(item=>item.id===o)?.response;",
    '  if(response)window.APMural?.share(response.comment||"");',
    "},"
  ].join("\n"), "abertura do mural pelo comprovante");
}

function addHistoryShare(script) {
  const map = "cards.innerHTML=records.length?records.map(record=>{";
  const closing = "+htmlSafe(facts)+'</span></span></article>';";
  const after = "\n }\n global.APStudentFinish=Object.freeze";
  script = replaceOnce(script, map,
    "const uid=account()?.storageId;\n  cards.innerHTML=records.length?records.map((record,index)=>{", "histórico dos treinos");
  script = replaceOnce(script, closing, [
    "+htmlSafe(facts)+'</span></span>'",
    "     +(uid&&global.APMural?'<button type=\"button\" class=\"ap-mural-share\" data-mural-history=\"'+index+'\">Compartilhar no Mural</button>':'')",
    "     +'</article>';"
  ].join("\n"), "botão no histórico");
  return replaceOnce(script, after, [
    "",
    "  for(const button of cards.querySelectorAll('[data-mural-history]')){",
    "   const comment=records[Number(button.dataset.muralHistory)]?.comment;",
    "   button.onclick=()=>{",
    "    if(uid&&account()?.storageId===uid)global.APMural?.share(comment||'');",
    "   };",
    "  }",
    after
  ].join("\n"), "texto escolhido no histórico");
}

function applyMural(index, client, css) {
  if (typeof index !== "string" || index.includes('id="ap-mural-student"')) {
    throw Error("Informe uma página de acesso compatível, sem o mural aplicado.");
  }
  if (typeof client !== "string" || !client.trim() || /<\/script/i.test(client)
    || typeof css !== "string" || !css.trim() || /<\/style/i.test(css)) {
    throw Error("Arquivos do mural inválidos.");
  }
  const tail = index.lastIndexOf("</body>");
  if (tail < 0 || !/^<\/body>\s*<\/html>\s*$/i.test(index.slice(tail))) {
    throw Error("Final da página de acesso ausente.");
  }
  index = editScript(index, "ap-student-accounts", addAccountAccess);
  index = editScript(index, "ap-feedback-student", addReceiptShare);
  index = editScript(index, "ap-student-finish-control", addHistoryShare);
  const end = index.lastIndexOf("</body>");
  return index.slice(0, end)
    + '\n<style id="ap-mural-css">\n' + css + '</style>\n'
    + '<script id="ap-mural-student">\n' + client + '</script>\n'
    + index.slice(end);
}

function makeUpdate(base, client, css) {
  if (base.format !== 1 || base.appId !== "com.tiagolima.agendapersonal"
    || base.version !== baseVersion || base.sequence !== baseSequence || !base.files) {
    throw Error("Use a fonte Agenda Personal 1.12.276 (sequência 382).");
  }
  const {agendaSignature, ...metadata} = base;
  const notes = "Adiciona o Mural da turma com compartilhamento opcional do comentário do treino.";
  return {
    ...metadata,
    version: "1.12.277",
    sequence: 383,
    files: {...base.files, "index.html": applyMural(base.files["index.html"], client, css)},
    notes,
    update: {category: "general", title: "Mural da turma", summary: notes}
  };
}

if (require.main === module) {
  const [input, output] = process.argv.slice(2);
  if (!input?.endsWith(".agenda.json") || !(output?.endsWith(".html") || output?.endsWith(".agenda.json"))) {
    console.error("Uso: node ponte/codigo/gerar-mural.cjs <base-1.12.276.agenda.json> <index.html ou teste.agenda.json>");
    process.exitCode = 1;
  } else {
    const base = JSON.parse(readFileSync(input, "utf8"));
    const client = readFileSync(join(__dirname, "telas", "ap-mural-student.js"), "utf8");
    const css = readFileSync(join(__dirname, "telas", "ap-mural-student.css"), "utf8");
    const result = makeUpdate(base, client, css);
    const html = output.endsWith(".html");
    writeFileSync(output, html ? result.files["index.html"] : JSON.stringify(result, null, 2) + "\n", {flag: "wx"});
    console.log("Arquivo de teste gerado em " + output);
  }
}

module.exports = {applyMural, makeUpdate};
