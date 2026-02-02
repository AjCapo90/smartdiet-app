# Calo - Work Log Notturno

## Obiettivo
Creare un'app di tracking dieta **incredibile e user-friendly** mentre Alessandro dorme (5 ore di lavoro autonomo).

## Flusso Utente Completo

```
1. UPLOAD DIETA (✅ fatto)
   └── Foto → OCR → Preview → Verify → Save

2. DASHBOARD (da migliorare)
   ├── Today's Progress (planned vs actual)
   ├── Quick Log buttons
   ├── Week overview
   └── Insights/Tips

3. LOG PASTO (da costruire meglio)
   ├── Selezione veloce da piano
   ├── Porzione effettiva (slider?)
   ├── Aggiungi extra
   └── Conferma

4. TRACKING (da costruire)
   ├── % completamento giornaliero
   ├── Streak giorni consecutivi
   ├── Trend settimanale
   └── Notifiche smart

5. SUGGESTIONS (da costruire)
   ├── Cosa mangiare ora?
   ├── Macro mancanti
   └── Swap suggestions
```

## Sprint Plan

### Sprint 1: Foundation (23:30 - 00:00)
- [x] Salva piano test
- [x] Verifica dashboard con dati
- [ ] Review architettura storage
- [ ] Plan meal logging UX

### Sprint 2: Meal Logging (00:00 - 00:30)
- [ ] Quick-log da piano del giorno
- [ ] Slider porzione (50%, 100%, 150%)
- [ ] "Ho mangiato qualcosa di diverso"
- [ ] Conferma rapida

### Sprint 3: Progress Tracking (00:30 - 01:00)
- [ ] Barra progresso animata
- [ ] Macro remaining display
- [ ] Meal checkmarks
- [ ] Daily summary card

### Sprint 4: Polish & Bugs (01:00 - 01:30)
- [ ] Fix "1g nocchi" → "gnocchi"
- [ ] Empty days handling
- [ ] Loading states
- [ ] Error messages migliori

### Sprint 5: Smart Features (01:30 - 02:00)
- [ ] "Prossimo pasto" suggestion
- [ ] Swap alternatives
- [ ] Streak counter
- [ ] Achievement badges?

### Sprint 6: Testing & Refinement (02:00 - 04:00)
- [ ] Full flow test
- [ ] Mobile responsiveness
- [ ] Edge cases
- [ ] Performance

## Technical Notes

### Storage Structure
```typescript
// localStorage keys
- 'calo_diet_plan' → DietPlan object
- 'calo_meal_logs' → MealLog[] array  
- 'calo_settings' → UserSettings
```

### Key Files
- `storage.service.ts` - Data persistence
- `diet-plan.component.ts` - Plan display
- `log-meal.component.ts` - Meal logging (needs work)
- `dashboard.component.ts` - Main view

## Ideas (Think Outside Box)
1. **Photo log** - Scatta foto del piatto, AI verifica
2. **Voice log** - "Ho mangiato pasta con pollo"
3. **Widget** - Quick-log senza aprire app
4. **Gamification** - Punti, livelli, achievements
5. **Social** - Condividi progress con nutrizionista
6. **Smart reminders** - "È ora di pranzo, oggi hai: ..."

## Progress Updates
- 23:30 - Inizio lavoro notturno
- ...to be updated...

---
*Alessandro torna alle ~04:30*
