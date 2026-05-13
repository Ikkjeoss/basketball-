let lagEl = document.getElementById("lag");
let leggEl = document.getElementById("legg_inp");
let tabellEl = document.querySelector("tbody");
let klasseEl = document.getElementById("grupper");
let resetEl = document.getElementById("reset");

sjekk();

leggEl.addEventListener("click", leggTil);
resetEl.addEventListener("click", reset);

function sjekk() {
    if (!localStorage.getItem("lagData")) {
        localStorage.lagData = "[]";
    }
    if (!localStorage.getItem("kamper")) {
        localStorage.kamper = "[]";
    }

    visLag();
    visKamper();
    oppdater();

    if (localStorage.getItem("semi1")) {
        gjenopprettSemifinaler();
    }
}

// Returns how many groups to use based on total team count
function antallGrupper(antallLag) {
    if (antallLag <= 4) return 2;
    if (antallLag <= 6) return 3;
    return 4;
}

// Reassigns all teams into groups from scratch based on current team count
function fordelGrupper(lagData) {
    const grupper = ["A", "B", "C", "D"];
    const nGrupper = antallGrupper(lagData.length);
    return lagData.map((lag, i) => ({
        ...lag,
        gruppe: grupper[i % nGrupper]
    }));
}

function leggTil() {
    let lagData = JSON.parse(localStorage.lagData);
    const navn = lagEl.value.trim();

    if (!navn) return;

    if (lagData.some(lag => lag.navn === navn)) {
        alert("Laget finnes allerede");
        return;
    }

    // Add team first, then redistribute everyone across the right number of groups
    lagData.push({ navn, gruppe: "A" });
    lagData = fordelGrupper(lagData);
    localStorage.lagData = JSON.stringify(lagData);
    localStorage.kamper = JSON.stringify(byggKamper(lagData));

    lagEl.value = "";
    visLag();
    visKamper();
}

function fjernLag(navn) {
    let lagData = JSON.parse(localStorage.lagData);
    lagData = lagData.filter(l => l.navn !== navn);
    localStorage.lagData = JSON.stringify(lagData);
    localStorage.kamper = JSON.stringify(byggKamper(lagData));
    visLag();
    visKamper();
}

function byggKamper(lagData) {
    const eksisterendeKamper = JSON.parse(localStorage.kamper || "[]");
    const grupper = ["A", "B", "C", "D"];
    let alleKamper = [];
    let kampNr = 1;
    let startMinutter = 9 * 60;

    let rundePerGruppe = {};
    grupper.forEach(gruppe => {
        let lag = [...lagData.filter(l => l.gruppe === gruppe)];
        let runder = [];

        if (lag.length % 2 !== 0) lag.push(null);

        for (let runde = 0; runde < lag.length - 1; runde++) {
            let kamper = [];
            for (let i = 0; i < lag.length / 2; i++) {
                let hjemme = lag[i];
                let borte = lag[lag.length - 1 - i];
                if (hjemme && borte) {
                    kamper.push({ hjemme: hjemme.navn, borte: borte.navn, gruppe });
                }
            }
            runder.push(kamper);
            lag = [lag[0], lag[lag.length - 1], ...lag.slice(1, lag.length - 1)];
        }

        rundePerGruppe[gruppe] = runder;
    });

    let maxRunder = Math.max(...grupper.map(g => rundePerGruppe[g]?.length || 0));

    for (let runde = 0; runde < maxRunder; runde++) {
        grupper.forEach(gruppe => {
            let rundeKamper = rundePerGruppe[gruppe]?.[runde];
            if (!rundeKamper) return;

            rundeKamper.forEach(kamp => {
                const total = startMinutter + (kampNr - 1) * 10;
                const timer = Math.floor(total / 60);
                const minutter = total % 60;
                const tid = `${String(timer).padStart(2, "0")}:${String(minutter).padStart(2, "0")}`;

                const gammel = eksisterendeKamper.find(
                    k => k.hjemme === kamp.hjemme && k.borte === kamp.borte
                );

                alleKamper.push({
                    kampNr,
                    tid,
                    gruppe: kamp.gruppe,
                    hjemme: kamp.hjemme,
                    borte: kamp.borte,
                    hjemmeScore: gammel ? gammel.hjemmeScore : "",
                    borteScore: gammel ? gammel.borteScore : "",
                    walkover: gammel ? gammel.walkover : false
                });

                kampNr++;
            });
        });
    }

    return alleKamper;
}

function visKamper() {
    const kamper = JSON.parse(localStorage.kamper || "[]");
    tabellEl.innerHTML = "";

    kamper.forEach(kamp => {
        const idx = kamp.kampNr - 1;
        const hVal = kamp.hjemmeScore !== "" ? kamp.hjemmeScore : "";
        const bVal = kamp.borteScore !== "" ? kamp.borteScore : "";
        const ferdig = kamp.hjemmeScore !== "" && kamp.borteScore !== "";

        tabellEl.innerHTML += `
            <tr${ferdig ? ' class="ferdig"' : ""}>
                <td>${kamp.kampNr}</td>
                <td class="tid">${kamp.tid}</td>
                <td>${kamp.gruppe}</td>
                <td>${kamp.hjemme}</td>
                <td>${kamp.borte}</td>
                <td><input type="number" placeholder="0" id="result${idx}_h" value="${hVal}"${ferdig ? " disabled" : ""}></td>
                <td><input type="number" placeholder="0" id="result${idx}_b" value="${bVal}"${ferdig ? " disabled" : ""}></td>
                <td>
                    <button onclick="registrerResultat(${idx})"${ferdig ? " disabled" : ""}>Ferdig</button>
                    <button onclick="walkover(${idx}, 'hjemme')"${ferdig ? " disabled" : ""} title="Walkover – bortelag møtte ikke opp">WO H</button>
                    <button onclick="walkover(${idx}, 'borte')"${ferdig ? " disabled" : ""} title="Walkover – hjemmelag møtte ikke opp">WO B</button>
                </td>
            </tr>
        `;
    });
}


function walkover(idx, tapende) {
    let kamper = JSON.parse(localStorage.kamper || "[]");
    const kamp = kamper[idx];

    if (!confirm(`Bekreft walkover: ${tapende === "hjemme" ? kamp.hjemme : kamp.borte} møtte ikke opp. Resultatet settes til 0–8.`)) return;

    if (tapende === "hjemme") {
        // Bortelag vinner
        kamp.hjemmeScore = 0;
        kamp.borteScore = 8;
    } else {
        // Hjemmelag vinner
        kamp.hjemmeScore = 8;
        kamp.borteScore = 0;
    }

    kamp.walkover = true;
    localStorage.kamper = JSON.stringify(kamper);
    visKamper();
    oppdater();
}

function registrerResultat(idx) {
    let kamper = JSON.parse(localStorage.kamper || "[]");
    const kamp = kamper[idx];

    const hjemmeScore = parseInt(document.getElementById(`result${idx}_h`).value);
    const borteScore = parseInt(document.getElementById(`result${idx}_b`).value);

    if (isNaN(hjemmeScore) || isNaN(borteScore)) {
        alert("Fyll inn resultat for begge lag");
        return;
    }

    kamp.hjemmeScore = hjemmeScore;
    kamp.borteScore = borteScore;
    kamp.walkover = false;

    localStorage.kamper = JSON.stringify(kamper);
    visKamper();
    oppdater();
}

function visLag() {
    let lagData = JSON.parse(localStorage.lagData);
    const grupper = ["A", "B", "C", "D"];

    klasseEl.innerHTML = grupper.map(gruppe => {
        const lagIGruppe = lagData.filter(lag => lag.gruppe === gruppe);
        if (lagIGruppe.length === 0) return "";

        return `
            <div class="gruppe">
                <h3>Gruppe ${gruppe}</h3>
                <ul>
                    ${lagIGruppe.map(lag => `
                        <li>
                            ${lag.navn}
                            <button onclick="fjernLag('${lag.navn}')">Fjern</button>
                        </li>
                    `).join("")}
                </ul>
            </div>
        `;
    }).join("");
}

function oppdater() {
    
}

function reset() {
    localStorage.lagData = "[]";
    localStorage.kamper = "[]";
    localStorage.removeItem("semi1");
    localStorage.removeItem("semi2");
    localStorage.removeItem("semi1Vinner");
    localStorage.removeItem("semi2Vinner");
    localStorage.removeItem("finaleVinner");

    tabellEl.innerHTML = "";
    klasseEl.innerHTML = "";

    document.getElementById("semi-finale1").style.display = "none";
    document.getElementById("semi-finale1").innerHTML = "";
    document.getElementById("semi-finale2").style.display = "none";
    document.getElementById("semi-finale2").innerHTML = "";
    document.getElementById("finale").style.display = "none";
    document.getElementById("finale").innerHTML = "";
}




function byggStatistikk(gruppe) {
    let lagData = JSON.parse(localStorage.lagData);
    let kamper = JSON.parse(localStorage.kamper || "[]");

    let stats = lagData
        .filter(l => l.gruppe === gruppe)
        .map(l => ({ navn: l.navn, poeng: 0, mol: 0, innslupne: 0, diff: 0, kamper: 0 }));

    kamper.filter(k => k.gruppe === gruppe).forEach(kamp => {
        if (kamp.hjemmeScore === "" || kamp.borteScore === "") return;
        let h = stats.find(l => l.navn === kamp.hjemme);
        let b = stats.find(l => l.navn === kamp.borte);
        if (!h || !b) return;

        h.mol += Number(kamp.hjemmeScore);
        b.mol += Number(kamp.borteScore);
        h.innslupne += Number(kamp.borteScore);
        b.innslupne += Number(kamp.hjemmeScore);
        h.diff = h.mol - h.innslupne;
        b.diff = b.mol - b.innslupne;
        h.kamper++;
        b.kamper++;

        // Basketball: 2pts for win, 1pt each for draw
        if (Number(kamp.hjemmeScore) > Number(kamp.borteScore)) {
            h.poeng += 2;
        } else if (Number(kamp.borteScore) > Number(kamp.hjemmeScore)) {
            b.poeng += 2;
        } else {
            h.poeng += 1;
            b.poeng += 1;
        }
    });

    return stats;
}


function innbyrdesPoeng(lagNavn, gruppe) {
    let kamper = JSON.parse(localStorage.kamper || "[]");
    let poengMap = {};
    lagNavn.forEach(n => poengMap[n] = 0);

    kamper
        .filter(k => k.gruppe === gruppe &&
            lagNavn.includes(k.hjemme) &&
            lagNavn.includes(k.borte) &&
            k.hjemmeScore !== "" && k.borteScore !== "")
        .forEach(kamp => {
            if (Number(kamp.hjemmeScore) > Number(kamp.borteScore)) {
                poengMap[kamp.hjemme] += 2;
            } else if (Number(kamp.borteScore) > Number(kamp.hjemmeScore)) {
                poengMap[kamp.borte] += 2;
            } else {
                poengMap[kamp.hjemme] += 1;
                poengMap[kamp.borte] += 1;
            }
        });

    return poengMap;
}


function trekkKey(navnA, navnB, gruppe) {
    // Sort names so the key is always the same regardless of comparison order
    const [x, y] = [navnA, navnB].sort();
    return `trekk_${gruppe}_${x}_${y}`;
}

function avgjørTrekning(navnA, navnB, gruppe) {
    const key = trekkKey(navnA, navnB, gruppe);
    let lagret = localStorage.getItem(key);
    if (!lagret) {
        const valg = prompt(
            `Fullstendig uavgjort mellom ${navnA} og ${navnB} i gruppe ${gruppe}!\n\nHvem vant trekningen?\n1 = ${navnA}\n2 = ${navnB}\n\nSkriv 1 eller 2:`
        );
        lagret = (valg === "2") ? navnB : navnA;
        localStorage.setItem(key, lagret);
    }
    return lagret;
}

function sorterTabell(stats, gruppe) {
    // First pass: sort by total points
    stats.sort((a, b) => b.poeng - a.poeng);

    // Find groups of teams with equal points and apply tiebreakers
    let i = 0;
    while (i < stats.length) {
        let j = i + 1;
        while (j < stats.length && stats[j].poeng === stats[i].poeng) j++;

        if (j - i > 1) {
            let tiedNames = stats.slice(i, j).map(l => l.navn);
            let h2h = innbyrdesPoeng(tiedNames, gruppe);

            // Pre-resolve any fully-tied pairs via prompt BEFORE sorting
            // so the comparator is stable and prompt only fires once per pair
            const treknMap = {};
            for (let p = i; p < j; p++) {
                for (let q = p + 1; q < j; q++) {
                    const a = stats[p], b = stats[q];
                    const alleLike =
                        h2h[a.navn] === h2h[b.navn] &&
                        a.diff === b.diff &&
                        a.mol === b.mol;
                    if (alleLike) {
                        treknMap[trekkKey(a.navn, b.navn, gruppe)] = avgjørTrekning(a.navn, b.navn, gruppe);
                    }
                }
            }

            stats.slice(i, j).sort((a, b) => {
                // 1. Head-to-head
                if (h2h[b.navn] !== h2h[a.navn]) return h2h[b.navn] - h2h[a.navn];
                // 2. Goal difference
                if (b.diff !== a.diff) return b.diff - a.diff;
                // 3. Goals scored
                if (b.mol !== a.mol) return b.mol - a.mol;
                // 4. Trekning
                const key = trekkKey(a.navn, b.navn, gruppe);
                return treknMap[key] === b.navn ? 1 : -1;
            }).forEach((lag, idx) => {
                stats[i + idx] = lag;
            });
        }

        i = j;
    }

    return stats;
}

function topLagIGruppe(gruppe) {
    const stats = sorterTabell(byggStatistikk(gruppe), gruppe);
    return stats[0];
}

// --- KNOCKOUT ---

function tidFraKampNr(kampNr) {
    const startMinutter = 9 * 60;
    const total = startMinutter + kampNr * 10;
    const timer = Math.floor(total / 60);
    const minutter = total % 60;
    return `${String(timer).padStart(2, "0")}:${String(minutter).padStart(2, "0")}`;
}

function alleGruppekamperFerdige() {
    const kamper = JSON.parse(localStorage.kamper || "[]");
    if (kamper.length === 0) return false;
    return kamper.every(k => k.hjemmeScore !== "" && k.borteScore !== "");
}

function visSemifinaler() {
    if (!alleGruppekamperFerdige()) {
        alert("Ikke alle gruppekamper er ferdige ennå!");
        return;
    }

    const lagData = JSON.parse(localStorage.lagData);
    const nGrupper = antallGrupper(lagData.length);
    const gruppeNavn = ["A", "B", "C", "D"].slice(0, nGrupper);
    const topLag = gruppeNavn.map(g => topLagIGruppe(g));

    const totalGruppekamper = JSON.parse(localStorage.kamper || "[]").length;
    const semi1Tid = tidFraKampNr(totalGruppekamper);
    const semi2Tid = tidFraKampNr(totalGruppekamper + 1);

    if (nGrupper === 2) {
        localStorage.setItem("semi1", JSON.stringify({ hjemme: topLag[0].navn, borte: topLag[1].navn, tid: semi1Tid }));
        localStorage.removeItem("semi2");
    } else if (nGrupper === 3) {
        const andreBestB = sorterTabell(byggStatistikk("B"), "B")[1];
        localStorage.setItem("semi1", JSON.stringify({ hjemme: topLag[0].navn, borte: topLag[2].navn, tid: semi1Tid }));
        localStorage.setItem("semi2", JSON.stringify({ hjemme: topLag[1].navn, borte: andreBestB.navn, tid: semi2Tid }));
    } else {
        localStorage.setItem("semi1", JSON.stringify({ hjemme: topLag[0].navn, borte: topLag[1].navn, tid: semi1Tid }));
        localStorage.setItem("semi2", JSON.stringify({ hjemme: topLag[2].navn, borte: topLag[3].navn, tid: semi2Tid }));
    }

    gjenopprettSemifinaler();
}

function gjenopprettSemifinaler() {
    const semi1 = JSON.parse(localStorage.getItem("semi1"));
    const semi2 = JSON.parse(localStorage.getItem("semi2"));
    const vinner1 = localStorage.getItem("semi1Vinner");
    const vinner2 = localStorage.getItem("semi2Vinner");

    document.getElementById("semi-finale1").style.display = "block";
    document.getElementById("semi-finale1").innerHTML = `
        <h3>Semifinale 1 — ${semi1.tid}</h3>
        <p>${semi1.hjemme} vs ${semi1.borte}</p>
        <input type="number" placeholder="0" id="semi1_h"${vinner1 ? " disabled" : ""}>
        <input type="number" placeholder="0" id="semi1_b"${vinner1 ? " disabled" : ""}>
        <button onclick="registrerSemi(1)"${vinner1 ? " disabled" : ""}>Ferdig</button>
        
        ${vinner1 ? `<p><strong>Vinner: ${vinner1}</strong></p>` : ""}
    `;

    if (semi2) {
        document.getElementById("semi-finale2").style.display = "block";
        document.getElementById("semi-finale2").innerHTML = `
            <h3>Semifinale 2 — ${semi2.tid}</h3>
            <p>${semi2.hjemme} vs ${semi2.borte}</p>
            <input type="number" placeholder="0" id="semi2_h"${vinner2 ? " disabled" : ""}>
            <input type="number" placeholder="0" id="semi2_b"${vinner2 ? " disabled" : ""}>
            <button onclick="registrerSemi(2)"${vinner2 ? " disabled" : ""}>Ferdig</button>
            
            ${vinner2 ? `<p><strong>Vinner: ${vinner2}</strong></p>` : ""}
        `;
    } else {
        document.getElementById("semi-finale2").style.display = "none";
        document.getElementById("semi-finale2").innerHTML = "";
    }

    if (!semi2 && vinner1) {
        localStorage.setItem("semi2Vinner", vinner1);
        sjekkOgVisFinale();
    } else if (vinner1 && vinner2) {
        sjekkOgVisFinale();
    }
}

function registrerSemi(semiNr) {
    const hjemmeScore = parseInt(document.getElementById(`semi${semiNr}_h`).value);
    const borteScore = parseInt(document.getElementById(`semi${semiNr}_b`).value);

    if (isNaN(hjemmeScore) || isNaN(borteScore)) {
        alert("Fyll inn resultat for begge lag");
        return;
    }

    const semi = JSON.parse(localStorage.getItem(`semi${semiNr}`));
    let vinner;

    if (hjemmeScore === borteScore) {
        // Penalty shootout — ask user who won
        const valg = confirm(`Uavgjort! Etter straffekast:\nTrykk OK hvis ${semi.hjemme} vant, Avbryt hvis ${semi.borte} vant.`);
        vinner = valg ? semi.hjemme : semi.borte;
    } else {
        vinner = hjemmeScore > borteScore ? semi.hjemme : semi.borte;
    }

    localStorage.setItem(`semi${semiNr}Vinner`, vinner);
    gjenopprettSemifinaler();
    sjekkOgVisFinale();
}

function sjekkOgVisFinale() {
    const vinner1 = localStorage.getItem("semi1Vinner");
    const vinner2 = localStorage.getItem("semi2Vinner");
    if (!vinner1 || !vinner2) return;

    const totalKamper = JSON.parse(localStorage.kamper || "[]").length;
    const finaleTid = tidFraKampNr(totalKamper + 2);
    localStorage.setItem("finaleTid", finaleTid);

    if (vinner1 === vinner2) {
        localStorage.setItem("finaleVinner", vinner1);
    }

    const finaleVinner = localStorage.getItem("finaleVinner");

    document.getElementById("finale").style.display = "block";

    if (vinner1 === vinner2) {
        document.getElementById("finale").innerHTML = `
            <h3>🏆 Turneringsvinner</h3>
            <p><strong>${finaleVinner} vinner turneringen!</strong></p>
        `;
        return;
    }

    document.getElementById("finale").innerHTML = `
        <h3>Finale — ${finaleTid}</h3>
        <p>${vinner1} vs ${vinner2}</p>
        <input type="number" placeholder="0" id="finale_h"${finaleVinner ? " disabled" : ""}>
        <input type="number" placeholder="0" id="finale_b"${finaleVinner ? " disabled" : ""}>
        <button onclick="registrerFinale()"${finaleVinner ? " disabled" : ""}>Ferdig</button>
        
        ${finaleVinner ? `<p><strong> Turneringsvinner: ${finaleVinner}!</strong></p>` : ""}
    `;
}

function registrerFinale() {
    const hjemmeScore = parseInt(document.getElementById("finale_h").value);
    const borteScore = parseInt(document.getElementById("finale_b").value);

    if (isNaN(hjemmeScore) || isNaN(borteScore)) {
        alert("Fyll inn resultat for begge lag");
        return;
    }

    const vinner1 = localStorage.getItem("semi1Vinner");
    const vinner2 = localStorage.getItem("semi2Vinner");
    let vinner;

    if (hjemmeScore === borteScore) {
        // Penalty shootout
        const valg = confirm(`Uavgjort! Etter straffekast:\nTrykk OK hvis ${vinner1} vant, Avbryt hvis ${vinner2} vant.`);
        vinner = valg ? vinner1 : vinner2;
    } else {
        vinner = hjemmeScore > borteScore ? vinner1 : vinner2;
    }

    localStorage.setItem("finaleVinner", vinner);
    sjekkOgVisFinale();
}
