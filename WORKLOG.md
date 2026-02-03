# Calo - Work Log Notturno

## Obiettivo
Creare un'app di tracking dieta **incredibile e user-friendly** mentre Alessandro dorme (5 ore di lavoro autonomo).

## Stato Attuale: 23:45

### ✅ Sprint 1 Completato

**Bug Fixati:**
1. ✅ Floating point precision (-146.89999 → -146.9)
2. ✅ Italian labels per meal logging

**Feature Aggiunte:**
1. ✅ Checkmarks sui pasti già loggati
2. ✅ Visual distinction logged vs unlogged
3. ✅ UI italiana completa nella pagina Log Meal

**Commits:**
- `e4bb8cb` - fix: floating point precision in dashboard macro displays
- `ce8b0a9` - feat: improve meal logging UX with Italian labels

### 📋 Cron Jobs Schedulati

| Sprint | Ora | Focus |
|--------|-----|-------|
| Sprint 2 | +30min | Quick-log, slider porzione |
| Sprint 3 | +1h | Progress tracking visuale |
| Sprint 4 | +1.5h | Bug fixes, polish |
| Sprint 5 | +2h | Smart features |
| Sprint 6 | +3h | Integration test |
| Final | +4h | Report per Alessandro |

## Flusso Utente Completo

```
1. UPLOAD DIETA (✅ funzionante)
   └── Foto → OCR → Preview → Verify → Save

2. DASHBOARD (✅ con dati)
   ├── Today's Progress (planned vs actual)
   ├── Quick Log buttons
   ├── Week overview
   └── Macro bars

3. LOG PASTO (✅ migliorato)
   ├── Quick-log dal piano del giorno ✅
   ├── Checkmarks sui pasti loggati ✅
   ├── Manual entry
   └── Voice input

4. TRACKING (da migliorare)
   ├── % completamento giornaliero
   ├── Streak giorni consecutivi
   └── Trend settimanale

5. SUGGESTIONS (da costruire)
   ├── Cosa mangiare ora?
   └── Macro mancanti
```

## Test Completati Oggi

| Test | Risultato |
|------|-----------|
| Upload foto dieta | ✅ 20-25s |
| OCR parsing | ✅ Tutti i pasti estratti |
| Preview editing | ✅ Funziona |
| Nutrition lookup | ✅ 33/33 alimenti |
| Verify calorie | ✅ Calcoli corretti |
| Salva piano | ✅ In localStorage |
| Dashboard con dati | ✅ Mostra piano |
| Log meal page | ✅ Italian labels |

## Bug Noti

1. ⚠️ "1g nocchi" invece di "gnocchi" (parsing OCR)
2. ⚠️ Giorni vuoti creati anche se non nell'immagine

## Prossimi Step

1. [ ] Slider porzione (50%, 100%, 150%)
2. [ ] Espandi pasto per vedere alimenti
3. [ ] "Prossimo pasto" suggestion
4. [ ] Streak counter
5. [ ] Fix parsing bugs

---

*Ultimo update: Sprint 1 completato - 23:45*
