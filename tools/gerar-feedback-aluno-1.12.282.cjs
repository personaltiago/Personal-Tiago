'use strict';

// Gera o pacote 1.12.282 (sem assinatura) a partir do pacote 1.12.281 (seq 387).
// Só o index.html (tela do aluno) muda. Duas coisas, ambas na janela "Como foi hoje?" do aluno:
//  1) Limite de 7: a lista mostra os 7 feedbacks mais recentes (presencial e online). É só um limite de EXIBIÇÃO:
//     a cópia guardada no celular e APFeedbackSync.items() continuam completas, porque o pet do aluno usa essa lista
//     para dar as recompensas dos treinos presenciais (apagar itens antigos faria o aluno perder XP e moedas).
//     Nada é apagado no servidor nem na área do professor, e uma resposta ainda não enviada (fila de envio) nunca some.
//  2) Compartilhar: o feedback já enviado ganha o botão "Compartilhar cartão", que abre o mesmo cartão
//     "FEEDBACK DE TREINO" que o professor compartilha (o código do cartão é copiado do professor.html do próprio
//     pacote, sem alterações), só que na cor do tema do aluno (barra, títulos e símbolo).
// Não mexe em descanso, cronômetros, alarmes, notificações, Firebase, dados de alunos, professor.html,
// avaliacoes.html, cadastro.html nem no histórico modular.

const { createHash } = require('node:crypto');
const { readFileSync, writeFileSync } = require('node:fs');
const assert = require('node:assert/strict');

const version = '1.12.282';
const sequence = 388;
const title = 'Feedback do aluno';
const summary = 'Como foi hoje? mostra os 7 feedbacks mais recentes do aluno; o feedback enviado ganha Compartilhar cartão, na cor do tema do aluno.';
const notes = 'Na janela Como foi hoje? do aluno, a lista passa a mostrar só os 7 feedbacks mais recentes (alunos presenciais e online). Quando chega o oitavo, o mais antigo deixa de aparecer na lista do aluno. '
  + 'Nada é apagado no servidor nem na sua área de feedbacks, o histórico interno do aparelho continua completo (o pet usa esse histórico para as recompensas dos treinos presenciais) e uma resposta que ainda não foi enviada nunca some. '
  + 'Depois que o feedback é enviado, aparece o botão Compartilhar cartão: ele abre o mesmo cartão FEEDBACK DE TREINO que você compartilha, só que na cor do tema do aluno (barra, títulos e símbolo), com Salvar imagem e Compartilhar (WhatsApp, Instagram e outros). '
  + 'O Voltar fecha primeiro a imagem e depois a janela de feedback. '
  + 'Este pacote inclui o Voltar passo a passo (1.12.280) e os Links dos alunos (1.12.281). Descanso, cronômetros, alarmes e notificações não foram alterados.';

// Bloco do cartão no professor.html do pacote 1.12.281 (copiado sem alterações para o index.html).
const CARD_START = '<script id="ap-feedback-card">';
const CARD_SHA256 = '077e363963ec815e83def78bee97a42363d27b531dc14689afa9d904d037f624';

const sha256 = text => createHash('sha256').update(text, 'utf8').digest('hex');

function replaceOne(source, previous, next) {
  const index = source.indexOf(previous);
  assert.ok(index >= 0, 'O trecho esperado não existe: ' + previous.slice(0, 80));
  assert.equal(source.indexOf(previous, index + previous.length), -1, 'O trecho está duplicado: ' + previous.slice(0, 80));
  return source.slice(0, index) + next + source.slice(index + previous.length);
}

function cardBlock(professorPage) {
  const start = professorPage.indexOf(CARD_START);
  assert.ok(start >= 0, 'Bloco do cartão de feedback não encontrado no professor.html');
  assert.equal(professorPage.indexOf(CARD_START, start + CARD_START.length), -1, 'Bloco do cartão duplicado no professor.html');
  const end = professorPage.indexOf('</script>', start);
  assert.ok(end > start, 'Fim do bloco do cartão não encontrado');
  const block = professorPage.slice(start, end + '</script>'.length);
  assert.equal(sha256(block), CARD_SHA256, 'O cartão de feedback do professor mudou: revise o gerador antes de continuar');
  return block;
}

// ---------- Limite de 7 só na exibição (ap-feedback-sync) ----------
const SYNC_EDITS = [
  // função que aplica o limite: os 7 mais recentes + qualquer item com resposta ainda na fila de envio
  [
    'd=()=>dispatchEvent(new CustomEvent("ap-feedback-changed"));function u(e,o=t()){',
    'd=()=>dispatchEvent(new CustomEvent("ap-feedback-changed"));const LIMIT=7;'
    + 'function capItems(list,outbox){const sorted=list.slice().sort((x,y)=>y.finishedAt-x.finishedAt||(x.id<y.id?-1:x.id>y.id?1:0)),'
    + 'keep=new Set(sorted.slice(0,LIMIT).map(x=>x.id));for(const x of sorted)outbox&&outbox[x.id]&&keep.add(x.id);return sorted.filter(x=>keep.has(x.id))}'
    + 'function u(e,o=t()){'
  ],
  // visible() = lista que o aluno vê (limitada); items() continua completa para o pet e para o restante do aplicativo
  [
    'window.APFeedbackSync=Object.freeze({create:async function(t){',
    'const visible=()=>t()?capItems(h(),c().outbox):[];window.APFeedbackSync=Object.freeze({limit:LIMIT,visible:visible,create:async function(t){'
  ],
  // os pendentes contados no Início e no pet são só os da lista visível
  [
    'pending:()=>h().filter(e=>!e.response)',
    'pending:()=>visible().filter(e=>!e.response)'
  ]
];

// ---------- Compartilhar o cartão na cor do tema (ap-feedback-student) ----------
const SHARE_FUNCTIONS =
  // cor do tema do aluno (a mesma que a janela usa) e ajuste mínimo de leitura sobre o fundo escuro do cartão
  'function feedbackCardAccent(){const n="function"==typeof prefs?prefs():{},raw=String(window.APStudentTheme?.color(n)||n.color||"#b6ff26");return/^#[0-9a-f]{6}$/i.test(raw)?raw:"#b6ff26"}'
  + 'function feedbackCardReadable(hex){const lum=h=>{const c=[1,3,5].map(i=>{const v=parseInt(h.slice(i,i+2),16)/255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)});return .2126*c[0]+.7152*c[1]+.0722*c[2]},ground=lum("#181c20");'
  + 'for(let step=0;step<=40;step++){const mixed="#"+[1,3,5].map(i=>{const v=parseInt(hex.slice(i,i+2),16);return Math.round(v+(255-v)*step/40).toString(16).padStart(2,"0")}).join("");if((lum(mixed)+.05)/(ground+.05)>=4.5)return mixed}return"#ffffff"}'
  + 'async function shareFeedbackCard(id){const item=t.visible().find(e=>e.id===id&&e.response),note=a("apFeedbackSendStatus");if(!item||"undefined"==typeof APFeedbackCard)return;'
  + 'try{const n="function"==typeof prefs?prefs():{},accent=feedbackCardReadable(feedbackCardAccent());'
  + 'await APFeedbackCard.open(item,{professional:"Agenda Personal",photo:"function"==typeof savedProfilePhoto?savedProfilePhoto():"",accent:accent});'
  + 'const g=a("apFeedbackImage");g&&(g.style.setProperty("--fb-accent",accent),g.classList.toggle("ap-feedback-light","claro"===n.mode))}'
  + 'catch(e){note.textContent="Não foi possível preparar o cartão agora. Tente novamente."}}';

const STUDENT_EDITS = [
  // botão no recibo do feedback enviado
  [
    'r.response&&(a("apFeedbackReceipt").innerHTML="<strong>Feedback recebido pelo professor</strong><p>Intensidade: "+n(r.response.intensity)+\'</p><p class="ap-feedback-comment">\'+n(r.response.comment||"Sem comentário.")+"</p>")',
    'r.response&&(a("apFeedbackReceipt").innerHTML="<strong>Feedback recebido pelo professor</strong><p>Intensidade: "+n(r.response.intensity)+\'</p><p class="ap-feedback-comment">\'+n(r.response.comment||"Sem comentário.")+"</p>"'
    + '+\'<div class="ap-feedback-actions"><button type="button" data-feedback-share="\'+n(r.id)+\'">Compartilhar cartão</button></div>\')'
  ],
  // clique no botão (delegado, porque o recibo é redesenhado a cada atualização)
  [
    'p.addEventListener("cancel",e=>{e.preventDefault(),k()}),',
    'p.addEventListener("cancel",e=>{e.preventDefault(),k()}),p.addEventListener("click",e=>{const t=e.target.closest("[data-feedback-share]");t&&shareFeedbackCard(t.dataset.feedbackShare)}),'
  ],
  // funções do cartão; fechar a janela fecha também a imagem; Voltar fecha a imagem primeiro
  [
    'function k(){return!!p.open&&(u(),p.close(),d===t.uid()&&s?.focus?.({preventScroll:!0}),d="",o="",c=null,!0)}',
    SHARE_FUNCTIONS
    + 'function k(){const g=a("apFeedbackImage");g?.open&&g.close();return!!p.open&&(u(),p.close(),d===t.uid()&&s?.focus?.({preventScroll:!0}),d="",o="",c=null,!0)}'
    + 'function kb(){const g=a("apFeedbackImage");return g?.open&&p.open?(g.close(),!0):k()}'
  ],
  [
    'back=function(...t){if(!k())return e.apply(this,t)}',
    'back=function(...t){if(!kb())return e.apply(this,t)}'
  ],
  [
    'window.handleAgendaSystemBack=function(...t){return!!k()||e.apply(this,t)}',
    'window.handleAgendaSystemBack=function(...t){return!!kb()||e.apply(this,t)}'
  ],
  // trocar de conta fecha também a imagem do cartão
  [
    'addEventListener("ap-account-changed",()=>{p.open&&p.close(),d="",o="",c=null,a("apFeedbackForm").reset(),f()})',
    'addEventListener("ap-account-changed",()=>{a("apFeedbackImage")?.open&&a("apFeedbackImage").close(),p.open&&p.close(),d="",o="",c=null,a("apFeedbackForm").reset(),f()})'
  ],
  // a lista e o detalhe usam a lista visível (7); a checagem do "enviado" continua olhando a lista completa
  [
    'const s=t.items(),i=t.local();',
    'const s=t.visible(),i=t.local();'
  ],
  [
    'o=e||t.pending()[0]?.id||t.items()[0]?.id||""',
    'o=e||t.pending()[0]?.id||t.visible()[0]?.id||""'
  ],
  // aviso discreto quando a lista está cheia (some se houver mensagem de atualização)
  [
    'a("apFeedbackStudentStatus").textContent=l.message,a("apFeedbackStudentRefresh").disabled=l.busy',
    'a("apFeedbackStudentStatus").textContent=l.message||(s.length>=t.limit?"Mostrando os "+t.limit+" feedbacks mais recentes.":""),a("apFeedbackStudentRefresh").disabled=l.busy'
  ]
];

// A lista completa de edições (o cartão entra antes do bloco do aluno, depois do bloco de sincronização).
function edits(card) {
  return [
    ...SYNC_EDITS,
    ...STUDENT_EDITS,
    ['<script id="ap-feedback-student">', card + '<script id="ap-feedback-student">']
  ];
}

function applyFeedback(page, professorPage) {
  const card = cardBlock(professorPage);
  return edits(card).reduce((current, [previous, next]) => replaceOne(current, previous, next), page);
}

function makeUpdate(source) {
  assert.equal(source.format, 1);
  assert.equal(source.appId, 'com.tiagolima.agendapersonal');
  assert.equal(source.version, '1.12.281');
  assert.equal(source.sequence, 387);
  const { agendaSignature, ...original } = source;
  const files = {...original.files, 'index.html': applyFeedback(original.files['index.html'], original.files['professor.html'])};
  return {...original, files, version, sequence, notes, update: {...original.update, title, summary}};
}

if (require.main === module) {
  const [, , sourceFile, targetFile = 'AgendaPersonal-1.12.282-Feedback-Aluno-Para-Assinar.agenda.json'] = process.argv;
  assert.ok(sourceFile, 'Uso: node tools/gerar-feedback-aluno-1.12.282.cjs AgendaPersonal-1.12.281-Links-Visual-Anamnese-Planos-Para-Assinar.agenda.json [saida.agenda.json]');
  const data = makeUpdate(JSON.parse(readFileSync(sourceFile, 'utf8')));
  const payload = JSON.stringify(data, null, 2) + '\n';
  assert.ok(Buffer.byteLength(payload, 'utf8') < 24 * 1024 ** 2);
  writeFileSync(targetFile, payload, {encoding: 'utf8', flag: 'wx'});
  console.log(targetFile);
}

module.exports = {makeUpdate, applyFeedback, cardBlock, edits, SYNC_EDITS, STUDENT_EDITS, version, sequence, title, summary, notes, CARD_START, CARD_SHA256};
