export interface TacticPosition {
  xPercent?: number;
  yPercent?: number;
  x?: number;
  y?: number;
  role: string;
}

export interface Tactic {
  name: string;
  shortName: string;
  description: string;
  bulletpoints: string[];
  extendedDescription: string;
  playerCount: number;
  positions: TacticPosition[];
}

export const TACTICS: Record<number, Tactic[]> = {
  // 7er Formationen (Kinderfußball bis U12)
  7: [
    {
      name: "Frei",
      shortName: "Frei",
      description: "App-Funktion: Spieler frei auf dem Feld platzieren.",
      bulletpoints: [
        "Keine taktischen Vorgaben.",
        "Manuelle Positionierung aller Spieler.",
        "Nützlich für individuelle Aufstellungen.",
      ],
      extendedDescription: `Dieses System erlaubt den Kindern, spontan ihre Positionen und Laufwege zu wählen. Es fördert Kreativität und Selbstorganisation, da keine festen Rollen vorgegeben sind. Gleichzeitig lernen sie, situativ Räume zu besetzen und sich gegenseitig abzusichern. Durch die fehlende Struktur besteht allerdings die Gefahr von Lücken in der Defensive und Überforderung bei der Raumaufteilung. Trainer sollten daher klare Prinzipien (z. B. bei Ballverlust sofort zurückarbeiten) vermitteln und gegebenenfalls kurze Spielunterbrechungen nutzen, um Abstimmungsprozesse zu erklären.`,
      playerCount: 7,
      positions: [],
    },
    {
      name: "2-3-1",
      shortName: "Pyramide",
      description: "Ausgewogene Grundformation",
      bulletpoints: [
        "Gute Balance zwischen Defensive und Offensive",
        "Starke Präsenz im Zentrum",
        "Außenspieler müssen viel Laufarbeit leisten",
        "Flügel werden nur einfach besetzt",
      ],
      extendedDescription: `In der E-Jugend lehrt das 2-3-1-System die Spieler, mit zwei Verteidigern auszukommen und gleichzeitig drei Mittelfeldspieler effektiv zu nutzen. Die Außenbahnspieler lernen, konstant nach hinten und nach vorne zu pendeln, was ihre Kondition stärkt. Es hilft den Kindern, grundlegende Passdreiecke zu verstehen und den Torwart ins Aufbauspiel einzubinden. Allerdings kann es zu Lücken auf den Flügeln kommen, wenn die Außenspieler nicht rechtzeitig unterstützen. Trainer sollten daher gezielte Flügelwechsel und Positionsrotation üben, um die hohe Laufbelastung auszugleichen.`,
      playerCount: 7,
      positions: [
        { xPercent: 50, yPercent: 95, role: "TW" },
        { xPercent: 30, yPercent: 75, role: "LV" },
        { xPercent: 70, yPercent: 75, role: "RV" },
        { xPercent: 25, yPercent: 45, role: "LM" },
        { xPercent: 50, yPercent: 45, role: "ZM" },
        { xPercent: 75, yPercent: 45, role: "RM" },
        { xPercent: 50, yPercent: 20, role: "ST" },
      ],
    },
    {
      name: "3-2-1",
      shortName: "Dreierkette",
      description: "Defensive Grundordnung",
      bulletpoints: [
        "Hohe defensive Absicherung",
        "Kompaktes Zentrum und einfache Konterchancen",
        "Geringe Breite und Raum im Mittelfeld",
        "Außenverteidiger tragen hohe Laufbelastung",
      ],
      extendedDescription: `Das 3-2-1-System bringt den Kindern bei, kompakt zu verteidigen und die Mitte zu verdichten. Die Außenverteidiger lernen hier eine Doppelrolle als Verteidiger und Angreifer. Durch die eng gestaffelte Formation wird das Kurzpassspiel in der Mitte gefördert. Gleichzeitig fehlt die Breite, weshalb Angriffe über außen erschwert sind und die Laufwege lang sind. Coaches sollten verstärkt auf die Kommunikation zwischen Abwehr und Mittelfeld achten und Laufwege der Außenverteidiger im Training visualisieren.`,
      playerCount: 7,
      positions: [
        { xPercent: 50, yPercent: 95, role: "TW" },
        { xPercent: 25, yPercent: 75, role: "LV" },
        { xPercent: 50, yPercent: 75, role: "IV" },
        { xPercent: 75, yPercent: 75, role: "RV" },
        { xPercent: 35, yPercent: 45, role: "LM" },
        { xPercent: 65, yPercent: 45, role: "RM" },
        { xPercent: 50, yPercent: 20, role: "ST" },
      ],
    },
    {
      name: "3-3",
      shortName: "Sechser",
      description: "Volles Mittelfeld",
      bulletpoints: [
        "Dominanz im Mittelfeld",
        "Gute Breitenbesetzung für Flügelspiel",
        "Wenig Lücken hinter dem Mittelfeld",
        "Anfällig bei schnellen Gegenangriffen",
      ],
      extendedDescription: `Mit dem 3-3-System lernen die Kinder, als Block zusammenzurücken und den Flügelbesatz effektiv zu nutzen. Das Fehlen einer offensiven und defensiven Mittellinie fördert die Flexibilität der Spieler, die situativ Rollen tauschen. Das System ist jedoch körperlich fordernd und erfordert Disziplin, um bei Ballverlust schnell in die Defensive zurückzufinden. Trainer sollten klare Vorgaben für das Verschieben der Dreierlinien machen und gezielt 1-gegen-1-Übungen auf den Außen durchführen.`,
      playerCount: 7,
      positions: [
        { xPercent: 50, yPercent: 95, role: "TW" },
        { xPercent: 25, yPercent: 75, role: "LV" },
        { xPercent: 50, yPercent: 75, role: "IV" },
        { xPercent: 75, yPercent: 75, role: "RV" },
        { xPercent: 25, yPercent: 30, role: "LA" },
        { xPercent: 50, yPercent: 30, role: "ZA" },
        { xPercent: 75, yPercent: 30, role: "RA" },
      ],
    },
  ],

  // 9er Formationen (Jugendfußball U13–U15)
  9: [
    {
      name: "Frei",
      shortName: "Frei",
      description: "App-Funktion: Spieler frei auf dem Feld platzieren.",
      bulletpoints: [
        "Keine taktischen Vorgaben.",
        "Manuelle Positionierung aller Spieler.",
        "Nützlich für individuelle Aufstellungen.",
      ],
      extendedDescription: `Das freie System im 9er-Fußball ermöglicht es TrainerInnen, situativ auf Spielverlauf und Gegner zu reagieren. Jugendliche lernen, Verantwortung für ihre Position zu übernehmen und sich selbstständig im Raum zu orientieren. Gleichzeitig besteht die Gefahr, dass unstrukturierte Phasen entstehen und Lücken in Abwehr oder Angriff auftreten. Daher sollten Grundprinzipien wie Kettenverschiebung und Rückwärtsbewegung klar kommuniziert werden.`,
      playerCount: 9,
      positions: [],
    },
    {
      name: "3-3-2",
      shortName: "Doppel 6",
      description: "Kompakte Mitte mit Doppelspitze",
      bulletpoints: [
        "Ausgewogene Breiten- und Tiefenbesetzung",
        "Starke Basis im Zentrum",
        "Zwei Stürmer bieten konstante Anspielstationen",
        "Flügelverteidigung benötigt hohe Laufbereitschaft",
      ],
      extendedDescription: `Die 3-3-2-Formation vermittelt den Jugendlichen Grundlagen der Viererkette plus Mittelfeldreihe. Durch die Doppelspitze lernen sie, gemeinsam Angriffe zu koordinieren und Räume zu schaffen. Die Dreierkette in Abwehr und Mittelfeld schult das Pressing und Verschieben im Block. Nach Ballverlust müssen Außenverteidiger und Außenmittelfeldspieler schnell zurückfinden, um nicht ausgekontert zu werden.`,
      playerCount: 9,
      positions: [
        { xPercent: 50, yPercent: 92, role: "TW" },
        { xPercent: 25, yPercent: 80, role: "LV" },
        { xPercent: 50, yPercent: 80, role: "IV" },
        { xPercent: 75, yPercent: 80, role: "RV" },
        { xPercent: 25, yPercent: 50, role: "LM" },
        { xPercent: 50, yPercent: 50, role: "ZM" },
        { xPercent: 75, yPercent: 50, role: "RM" },
        { xPercent: 35, yPercent: 30, role: "LS" },
        { xPercent: 65, yPercent: 30, role: "RS" },
      ],
    },
    {
      name: "3-2-3",
      shortName: "Triangel",
      description: "Ausgewogenes Dreieckssystem",
      bulletpoints: [
        "Stabiles Zentrum und breite Flügel",
        "Fördert Passdreiecke",
        "Hohe Lauf- und Hilfsbereitschaft erforderlich",
        "Anfällig bei schwachem Gegenpressing",
      ],
      extendedDescription: `Das 3-2-3-System stärkt das Passspiel durch Dreiecksbildung und unterstützt kreatives Kombinationsspiel. Mit drei Angreifern üben die Jugendlichen ständig Druck auf die Abwehr aus, während das zentrale Mittelfeld eng gestaffelt verteidigt. Die Rückwärtsbewegung bei Ballverlust ist entscheidend, um Lücken zu schließen. Trainer sollten deshalb Gegenpressing-Szenarien intensiv trainieren und die Rolle der Außenstürmer im Defensivverbund klären.`,
      playerCount: 9,
      positions: [
        { xPercent: 50, yPercent: 92, role: "TW" },
        { xPercent: 25, yPercent: 80, role: "LV" },
        { xPercent: 50, yPercent: 80, role: "IV" },
        { xPercent: 75, yPercent: 80, role: "RV" },
        { xPercent: 35, yPercent: 50, role: "LM" },
        { xPercent: 65, yPercent: 50, role: "RM" },
        { xPercent: 25, yPercent: 30, role: "LA" },
        { xPercent: 50, yPercent: 30, role: "ZA" },
        { xPercent: 75, yPercent: 30, role: "RA" },
      ],
    },
    {
      name: "4-3-1",
      shortName: "Abwehrviereck",
      description: "Defensive Stabilität mit Einzelstürmer",
      bulletpoints: [
        "Viererkette bietet solide Defensive",
        "Einzelstürmer kann isoliert sein",
        "Fördert offensives Einrücken der Außenverteidiger",
        "Mittelfeld muss intensiv nachrücken",
      ],
      extendedDescription: `Im 4-3-1-System lernen die Jugendlichen die klassische Viererkette kennen und trainieren das Aufrücken von Außenverteidigern. Der Einzelstürmer lehrt die Wichtigkeit des Mittelfeldpressings und des Nachrückens, um Unterzahl zu vermeiden. Durch situatives Einrücken der Halbpositionen entsteht ein variables Spiel, das Verteidigung und Angriff verbindet. Trainer sollten Rollenspiele simulieren, um das Verständnis für Wechsel zwischen 4-3-1 und 2-5-3 (bei Ballbesitz) zu vermitteln.`,
      playerCount: 9,
      positions: [
        { xPercent: 50, yPercent: 92, role: "TW" },
        { xPercent: 20, yPercent: 80, role: "LV" },
        { xPercent: 40, yPercent: 80, role: "LIV" },
        { xPercent: 60, yPercent: 80, role: "RIV" },
        { xPercent: 80, yPercent: 80, role: "RV" },
        { xPercent: 30, yPercent: 50, role: "LM" },
        { xPercent: 50, yPercent: 50, role: "ZM" },
        { xPercent: 70, yPercent: 50, role: "RM" },
        { xPercent: 50, yPercent: 25, role: "ST" },
      ],
    },
  ],

  // 11er Formationen (Übergang Jugend → Erwachsenenfußball ab U16)
  11: [
    {
      name: "Frei",
      shortName: "Frei",
      description: "App-Funktion: Spieler frei auf dem Feld platzieren.",
      bulletpoints: [
        "Keine taktischen Vorgaben.",
        "Manuelle Positionierung aller Spieler.",
        "Nützlich für individuelle Aufstellungen.",
      ],
      extendedDescription: `Das freie System im Übergang zur A-Jugend ermöglicht es, verschiedene Formationen je nach Spielsituation zu testen und die Spielintelligenz zu fördern. Spieler lernen, Verantwortung für Raumaufteilung zu übernehmen und eigene Entscheidungen zu treffen. Es eignet sich, um vorgegebene taktische Prinzipien (z. B. Pressinglinien, Staffelungen) situativ auszuprobieren. Gleichzeitig müssen klare Kommunikationsstrukturen bestehen, damit die Mannschaft nicht auseinanderfällt.`,
      playerCount: 11,
      positions: [],
    },
    {
      name: "4-4-2",
      shortName: "Klassiker",
      description: "Traditionelles Flachsystem",
      bulletpoints: [
        "Klare Rollenverteilung und Struktur",
        "Gute Balance zwischen Defensive und Offensive",
        "Nummerische Unterzahl im Zentrum gegen 3er-Mittelfeld möglich",
        "Fördert Flügelspiel und Konter",
      ],
      extendedDescription: `Das 4-4-2-System vermittelt den A-Jugendlichen die Grundprinzipien der Viererkette und des flachen Mittelfelds. Die Spieler lernen, als Kette zu verschieben und die Räume zwischen den Linien zu kontrollieren. Zwei Stürmer üben permanentes Pressing und unterstützen sich gegenseitig in der Abschlussvorbereitung. Die zentrale Unterzahlsituation erfordert von den Mittelfeldspielern hohe Laufbereitschaft und Antizipation. Trainer sollten situatives Verschieben gegen 3-4-3 simulieren und das Flügelspiel mit Überladungen üben.`,
      playerCount: 11,
      positions: [
        { xPercent: 50, yPercent: 95, role: "TW" },
        { xPercent: 20, yPercent: 82, role: "LV" },
        { xPercent: 40, yPercent: 82, role: "LIV" },
        { xPercent: 60, yPercent: 82, role: "RIV" },
        { xPercent: 80, yPercent: 82, role: "RV" },
        { xPercent: 20, yPercent: 50, role: "LM" },
        { xPercent: 40, yPercent: 50, role: "LZM" },
        { xPercent: 60, yPercent: 50, role: "RZM" },
        { xPercent: 80, yPercent: 50, role: "RM" },
        { xPercent: 35, yPercent: 25, role: "LS" },
        { xPercent: 65, yPercent: 25, role: "RS" },
      ],
    },
    {
      name: "4-3-3",
      shortName: "Flügelzange",
      description: "Breit und Pressingorientiert",
      bulletpoints: [
        "Hoher Druck durch Dreierangriff",
        "Ausgezeichnete Breitenbesetzung",
        "Große Räume im Mittelfeld bei Ballverlust",
        "Erfordert hohe Laufleistung der Flügelspieler",
      ],
      extendedDescription: `Das 4-3-3-System bietet den Spielern ein offensives Grundmuster mit drei Angreifern. Sie lernen, Flügelspiel und Pressing zu kombinieren und verschiedene Rollen im Dreiecks-Mittelfeld zu übernehmen. Das schnelle Umschalten zwischen Angriff und Verteidigung wird durch definierte Laufwege geschult. Bei Ballverlust müssen die Außenstürmer sofort in die Rückwärtsbewegung gehen, um Konter zu verhindern. Coaches sollten im Training Umschaltübungen in hoher Intensität durchführen und die Rolle des Sechsers im Defensivverbund klar definieren.`,
      playerCount: 11,
      positions: [
        { xPercent: 50, yPercent: 95, role: "TW" },
        { xPercent: 20, yPercent: 82, role: "LV" },
        { xPercent: 40, yPercent: 82, role: "LIV" },
        { xPercent: 60, yPercent: 82, role: "RIV" },
        { xPercent: 80, yPercent: 82, role: "RV" },
        { xPercent: 30, yPercent: 55, role: "LZM" },
        { xPercent: 50, yPercent: 55, role: "ZM" },
        { xPercent: 70, yPercent: 55, role: "RZM" },
        { xPercent: 25, yPercent: 25, role: "LA" },
        { xPercent: 50, yPercent: 25, role: "ZA" },
        { xPercent: 75, yPercent: 25, role: "RA" },
      ],
    },
    {
      name: "3-5-2",
      shortName: "Englische Variante",
      description: "Mittelfelddominanz mit Wingbacks",
      bulletpoints: [
        "Kontrolle des Zentrums mit fünf Spielern",
        "Robuste Dreier-Abwehrkette",
        "Breitenprobleme auf Außen bei Ballverlust",
        "Komplexe Abstimmung erforderlich",
      ],
      extendedDescription: `Im 3-5-2-System erleben die Spieler die Balance zwischen Mittelfeldkontrolle und Flügelspiel durch Wingbacks. Sie lernen, Formationsübergänge (3-5-2 zu 5-3-2) situativ umzusetzen. Die Doppelrolle der Außenspieler fördert ihre Lauf- und Entscheidungsfähigkeit auf der kompletten Außenbahn. Gleichzeitig müssen die Spieler im Zentrum eng zusammenarbeiten, um Ballverluste zu kompensieren. Intensive taktische Schulung im Verschieben und Absichern ist hier unerlässlich.`,
      playerCount: 11,
      positions: [
        { xPercent: 50, yPercent: 95, role: "TW" },
        { xPercent: 30, yPercent: 82, role: "LIV" },
        { xPercent: 50, yPercent: 82, role: "IV" },
        { xPercent: 70, yPercent: 82, role: "RIV" },
        { xPercent: 15, yPercent: 60, role: "LWB" },
        { xPercent: 35, yPercent: 55, role: "LZM" },
        { xPercent: 50, yPercent: 55, role: "ZM" },
        { xPercent: 65, yPercent: 55, role: "RZM" },
        { xPercent: 85, yPercent: 60, role: "RWB" },
        { xPercent: 35, yPercent: 25, role: "LS" },
        { xPercent: 65, yPercent: 25, role: "RS" },
      ],
    },
  ],
};
