document.addEventListener("DOMContentLoaded", () => {

    visStatistikk();
});

function visStatistikk() {

    let lagData = JSON.parse(localStorage.getItem("lagData")) || [];
    let kamper = JSON.parse(localStorage.getItem("kamper")) || [];

    const grupper = ["A", "B", "C", "D"];

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

    // regn ut alt fra kamper
    kamper.forEach(kamp => {

        if (kamp.hjemmeScore === "" || kamp.borteScore === "" || kamp.hjemmeScore === undefined) {
            return;
        }

        let hjemme = stats.find(l => l.navn === kamp.hjemme);
        let borte = stats.find(l => l.navn === kamp.borte);

        if (!hjemme || !borte) return;

        hjemme.kamper++;
        borte.kamper++;

        hjemme.mol += Number(kamp.hjemmeScore);
        hjemme.innslupne += Number(kamp.borteScore);

        borte.mol += Number(kamp.borteScore);
        borte.innslupne += Number(kamp.hjemmeScore);

        if (kamp.hjemmeScore > kamp.borteScore) {

            hjemme.vunnet++;
            hjemme.poeng += 3;

            borte.tap++;

        } else if (kamp.borteScore > kamp.hjemmeScore) {

            borte.vunnet++;
            borte.poeng += 3;

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
            .sort((a, b) =>
                b.poeng - a.poeng ||
                b.diff - a.diff ||
                b.mol - a.mol
            );

        if (gruppeLag.length === 0) return;

        html += `
        <div class="grupp">

            <table class="tabeller">

                <thead>

                    <tr>
                        <th colspan="9">Gruppe ${gruppe}</th>
                    </tr>

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
        <br>
        `;
    });

    const el = document.getElementById("container");

    if (!el) return;

    el.innerHTML = html;
    el.innerHTML = html;
    setInterval(() => {
    location.reload();
    }, 3000);
}
