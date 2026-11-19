'use strict';
// Estado de exemplo (alunos, aulas, ficha de treino) para abrir as janelas com conteúdo realista. Dados inventados.
function estado() {
  const hoje = new Date(); const iso = d => d.toISOString().slice(0, 10);
  const add = n => { const d = new Date(hoje); d.setDate(d.getDate() + n); return iso(d); };
  const ex = (id, name, sets, reps, load, rest, muscle, notes = '') => ({id, name, sets, reps, load, rest, video: '', notes, observations: '', muscle, category: 'Musculação', guidanceVersion: 1, catalogId: ''});
  return {
    students: [
      {id: 's1', name: 'Mariana Duarte Albuquerque', studentType: 'presencial', phone: '(65) 99281-4470', location: 'Academia Bio Fit · Rua das Palmeiras, 220, Jardim Aclimação, Cuiabá', notes: 'Prefere treinar cedo. Evitar impacto no joelho direito.', financeEnabled: true, startDate: add(-70), dueDate: add(12), monthlyValue: '320,00', paymentReminderDays: 3},
      {id: 's2', name: 'Rafael Monteiro', studentType: 'online', phone: '(65) 98817-3302', location: '', notes: '', financeEnabled: true, startDate: add(-30), dueDate: add(-2), monthlyValue: '250,00', paymentReminderDays: 3},
      {id: 's3', name: 'Beatriz Lemos', studentType: 'presencial', phone: '(65) 99702-1188', location: 'Condomínio Parque dos Ipês, bloco 4', notes: 'Gestante, liberada pela obstetra.', financeEnabled: false, startDate: '', dueDate: '', monthlyValue: '', paymentReminderDays: 3},
      {id: 's4', name: 'Carlos Eduardo Pinheiro', studentType: '', phone: '(65) 99133-9007', location: '', notes: '', financeEnabled: false, startDate: '', dueDate: '', monthlyValue: '', paymentReminderDays: 3}
    ],
    lessons: [
      {id: 'l1', studentId: 's1', date: iso(hoje), time: '07:00', duration: 60, type: 'presencial', location: 'Academia Bio Fit', lead: 30, repeat: 'weekly', repeatDays: [1, 3, 5], notes: ''},
      {id: 'l2', studentId: 's3', date: iso(hoje), time: '09:30', duration: 50, type: 'presencial', location: 'Condomínio Parque dos Ipês', lead: 30, repeat: 'weekly', repeatDays: [2, 4], notes: ''},
      {id: 'l3', studentId: 's2', date: add(1), time: '18:00', duration: 45, type: 'online', location: '', lead: 15, repeat: 'none', repeatDays: [], notes: ''}
    ],
    workoutPlans: [{
      id: 'p1', studentId: 's1', name: 'Hipertrofia · fase 2', goal: 'Ganho de massa magra', level: '', startDate: add(-20), endDate: add(40), autoArchive: false, visibility: 'always',
      age: '34', sex: 'feminino', weight: '62,5', height: '1,68', currentLevel: 'Intermediária', organization: 'week', notes: 'Priorizar execução controlada. Cargas sobem quando fechar todas as repetições.', archived: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      days: [
        {id: 'd1', name: 'Treino A · Peito e tríceps', weekday: 1, notes: 'Aquecimento de ombro por 5 minutos antes.', exercises: [
          ex('e1', 'Supino reto com barra', '4', '8 a 10', '40 kg', '90 s', 'Peito', 'Escápulas travadas.'), ex('e2', 'Supino inclinado com halteres', '3', '10', '14 kg', '75 s', 'Peito'),
          ex('e3', 'Crucifixo no cabo', '3', '12', '10 kg', '60 s', 'Peito'), ex('e4', 'Tríceps testa', '3', '12', '20 kg', '60 s', 'Tríceps'), ex('e5', 'Tríceps corda', '3', '15', '18 kg', '45 s', 'Tríceps')]},
        {id: 'd2', name: 'Treino B · Costas e bíceps', weekday: 3, notes: '', exercises: [
          ex('e6', 'Puxada frontal', '4', '10', '45 kg', '90 s', 'Costas'), ex('e7', 'Remada curvada', '4', '8 a 10', '35 kg', '90 s', 'Costas'), ex('e8', 'Rosca direta', '3', '12', '16 kg', '60 s', 'Bíceps')]},
        {id: 'd3', name: 'Treino C · Pernas', weekday: 5, notes: '', exercises: [
          ex('e9', 'Agachamento livre', '4', '8', '50 kg', '120 s', 'Pernas'), ex('e10', 'Leg press 45', '4', '12', '160 kg', '90 s', 'Pernas')]}
      ]}],
    workoutExecutions: [], workoutDrafts: {}, exerciseCatalog: [], exerciseCatalogOverrides: {}, exerciseFavorites: [], workoutRest: null,
    occurrenceStatus: {}, dismissedMakeups: {}, history: [], payments: [], financeExpenses: [], waitlist: [], lessonTimers: {}
  };
}
module.exports = {estado};
