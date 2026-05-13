document.addEventListener("DOMContentLoaded", () => {
    visStatistikk();
    visSluttspill();
});

function visStatistikk() {
    let lagData = JSON.parse(localStorage.getItem("lagData")) || [];
    let kamper = JSON.parse(localStorage.getItem("kamper")) || [];

    let stats = lagData.map(lag => ({
        navn: lag.navn,
        gruppe: lag.gruppe,
        kamper: 0,
        vunnet: 0,
        uavgjort: 0,
        tap: 0,
        mol: 0,
        innslupne: 0,
        diff: 0,
        poeng: 0
    }));

    kamper.forEach(kamp => {
        if (kamp.hjemmeScore === "" || kamp.borteScore === "" || kamp.hjemmeScore === undefined) return;

        let hjemme = stats.find(l => l.navn === kamp.hjemme);
        let borte = stats.find(l => l.navn === kamp.borte);
        if (!hjemme || !borte) return;

        hjemme.kamper++;
        borte.kamper++;

        hjemme.mol += Number(kamp.hjemmeScore);
        hjemme.innslupne += Number(kamp.borteScore);
        borte.mol += Number(kamp.borteScore);
        borte.innslupne += Number(kamp.hjemmeScore);

        // Basketball: 2pts win, 1pt draw
        if (Number(kamp.hjemmeScore) > Number(kamp.borteScore)) {
            hjemme.vunnet++;
            hjemme.poeng += 2;
            borte.tap++;
        } else if (Number(kamp.borteScore) > Number(kamp.hjemmeScore)) {
            borte.vunnet++;
            borte.poeng += 2;
            hjemme.tap++;
        } else {
            hjemme.uavgjort++;
            borte.uavgjort++;
            hjemme.poeng++;
            borte.poeng++;
        }

        hjemme.diff = hjemme.mol - hjemme.innslupne;
        borte.diff = borte.mol - borte.innslupne;
    });

    render(stats);
}

function render(stats) {
    const grupper = ["A", "B", "C", "D"];
    let html = "";

    grupper.forEach(gruppe => {
        let gruppeLag = stats
            .filter(l => l.gruppe === gruppe)
            .sort((a, b) => b.poeng - a.poeng || b.diff - a.diff || b.mol - a.mol);

        if (gruppeLag.length === 0) return;

        html += `
        <div class="grupp">
            <table class="tabeller">
                <thead>
                    <tr><th colspan="9">Gruppe ${gruppe}</th></tr>
                    <tr>
                        <th>Lag</th>
                        <th>Kamper</th>
                        <th>Vunnet</th>
                        <th>Uavgjort</th>
                        <th>Tapt</th>
                        <th>Mål</th>
                        <th>Innslupne</th>
                        <th>Diff</th>
                        <th>Poeng</th>
                    </tr>
                </thead>
                <tbody>
                    ${gruppeLag.map(lag => `
                        <tr>
                            <td>${lag.navn}</td>
                            <td>${lag.kamper}</td>
                            <td>${lag.vunnet}</td>
                            <td>${lag.uavgjort}</td>
                            <td>${lag.tap}</td>
                            <td>${lag.mol}</td>
                            <td>${lag.innslupne}</td>
                            <td>${lag.diff}</td>
                            <td>${lag.poeng}</td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
        </div>
        `;
    });

    const el = document.getElementById("container");
    if (!el) return;
    el.innerHTML = html;

    setInterval(() => location.reload(), 3000);
}

function visSluttspill() {
    const semi1 = localStorage.getItem("semi1");
    const semi2 = localStorage.getItem("semi2");
    if (!semi1 || !semi2) return;

    const s1 = JSON.parse(semi1);
    const s2 = JSON.parse(semi2);
    const vinner1 = localStorage.getItem("semi1Vinner");
    const vinner2 = localStorage.getItem("semi2Vinner");
    const finaleVinner = localStorage.getItem("finaleVinner");
    const finaleTid = localStorage.getItem("finaleTid") || "";

    // --- Semifinal 1 ---
    const sf1El = document.getElementById("semi-finale1");
    if (sf1El) {
        sf1El.style.display = "block";
        sf1El.innerHTML = `
            <h3>Semifinale 1 — ${s1.tid}</h3>
            <p>${s1.hjemme} vs ${s1.borte}</p>
            ${vinner1
                ? `<p><strong> Vinner: ${vinner1}</strong></p>`
                : `<p><em>Ikke spilt ennå</em></p>`}
        `;
    }

    // --- Semifinal 2 ---
    const sf2El = document.getElementById("semi-finale2");
    if (sf2El) {
        sf2El.style.display = "block";
        sf2El.innerHTML = `
            <h3>Semifinale 2 — ${s2.tid}</h3>
            <p>${s2.hjemme} vs ${s2.borte}</p>
            ${vinner2
                ? `<p><strong> Vinner: ${vinner2}</strong></p>`
                : `<p><em>Ikke spilt ennå</em></p>`}
        `;
    }

    // --- Finale (only show once both semi winners are known) ---
    if (vinner1 && vinner2) {
        const finEl = document.getElementById("finale");
        if (finEl) {
            finEl.style.display = "block";
            finEl.innerHTML = `
                <h3>Finale — ${finaleTid}</h3>
                <p>${vinner1} vs ${vinner2}</p>
                ${finaleVinner
                    ? `<p><strong> Turneringsvinner: ${finaleVinner}!</strong></p>`
                    : `<p><em>Ikke spilt ennå</em></p>`}
            `;
        }
    }
}
