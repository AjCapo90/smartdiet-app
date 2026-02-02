# Calo - Work Log

## Sessione: 2026-02-02 23:00

### ✅ Completato

1. **Bug critico risolto: Nutrition API**
   - OpenFoodFacts restituiva prodotti sbagliati (pollo=5kcal!)
   - Aggiunto database locale 100+ alimenti italiani server-side
   - Conversione intelligente "pz" con serving sizes corretti
   - Commit: `d9d577e`

2. **Test API verificati:**
   - Pollo 100g: 165 kcal ✅
   - Riso 80g: 104 kcal ✅
   - Uova 2pz: 155 kcal ✅ (2×50g)
   - Banana 1pz: 107 kcal ✅ (120g)
   - Avena 40g: 156 kcal ✅
   - Tonno scatoletta: 158 kcal ✅
   - Tutti con source: "local", confidence: "high"

### 🔄 In Progress

1. **Test visivo flusso completo** - In attesa browser access
2. **Test parsing OCR** - Da verificare con immagine reale

### 📋 Da Fare

1. [ ] Test upload immagine piano alimentare
2. [ ] Verificare parsing tutti 7 giorni / 5 pasti
3. [ ] Verificare ordinamento giorni (Lun→Dom)
4. [ ] Test preview UI - editing alimenti
5. [ ] Test verify UI - calcolo kcal
6. [ ] Test salvataggio piano
7. [ ] Screenshot intero flusso
8. [ ] Aggiungere varianti "light" al DB locale

### 🐛 Bug Trovati & Risolti

| Bug | Stato | Fix |
|-----|-------|-----|
| OpenFoodFacts match prodotti sbagliati | ✅ Fixed | Database locale first |
| "pz" = 100g sempre | ✅ Fixed | Serving sizes per alimento |
| Solo colazione estratta | Da testare | Prompt GPT aggiornato |
| Giorni partono da Giovedì | Da testare | Sorting aggiunto |

### 💡 Miglioramenti Proposti

1. **Varianti "light"** - philadelphia light, yogurt light, etc.
2. **Marca-aware** - riconoscere brand (Müller, Fage, etc.)
3. **Cache risultati** - evitare API calls duplicate

---

*Prossimo step: browser access per test visivo completo*
