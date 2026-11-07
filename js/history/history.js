
(() => {
  const $ = selector => document.querySelector(selector);

  // Ilustraciones locales provisionales.
  const image = year =>
    `assets/history/${year}.svg`;

  const fallback = 'assets/home/historia.jpg';

  const source = (label, url) => ({ label, url });

  const lmbChampions = source(
    'LMB · Campeones históricos',
    'https://www.milb.com/news/gcs-16712968'
  );

  const lmbHistory = source(
    'LMB · Historia del circuito',
    'https://www.milb.com/news/gcs-148625'
  );

  // Crear un acontecimiento.
  const event = (year, title, text, picture = fallback) => ({
    year, title, text, image: picture
  });

  // Línea del tiempo general.
  const baseball = {
    events: [
      event(
        '1845',
        'Organización de las reglas',
        'El club Knickerbocker de Nueva York formalizó reglas que influyeron en el desarrollo del béisbol moderno.',
        image('1845')
      ),
      event(
        '1869',
        'El béisbol profesional',
        'Los Cincinnati Red Stockings impulsaron el modelo de equipo profesional que marcaría una nueva etapa del deporte.',
        image('1899')
      ),
      event(
        '1876',
        'Nace la Liga Nacional',
        'La creación de la National League consolidó una organización duradera para el béisbol profesional estadounidense.',
        image('1899')
      ),
      event(
        '1925',
        'Nace la Liga Mexicana de Beisbol',
        'La LMB inició su primera temporada y comenzó una trayectoria fundamental para el béisbol profesional de México.',
        image('1925')
      ),
      event(
        '1947',
        'Jackie Robinson transforma MLB',
        'El 15 de abril, Robinson debutó con Brooklyn y rompió la barrera racial de las Grandes Ligas modernas.',
        image('1946')
      ),
      event(
        '1973',
        'El bateador designado',
        'La Liga Americana adoptó la regla del bateador designado, transformando la estrategia ofensiva.',
        image('1955')
      ),
      event(
        '2025',
        'Centenario de la LMB',
        'La Liga Mexicana de Beisbol conmemoró cien años de historia desde su temporada inaugural.',
        image('2025')
      )
    ],
    sources: [
      source(
        'Salón de la Fama · Historia del béisbol',
        'https://baseballhall.org/baseball-history'
      ),
      source(
        'MLB · Historia de Jackie Robinson',
        'https://www.mlb.com/robinson-training-complex/jackie-robinson-day'
      ),
      source(
        'MLB · Regla del bateador designado',
        'https://www.mlb.com/glossary/rules/designated-hitter-rule'
      ),
      source(
        'Correos de México · Centenario de la LMB',
        'https://www.gob.mx/correosdemexico/acciones-y-programas/100-anos-de-la-liga-mexicana-de-beisbol'
      ),
      lmbHistory
    ]
  };

  // Historia de los clubes de la Zona Norte.
  const teams = [
    {
      id: 'sultanes',
      code: 'MTY',
      name: 'Sultanes de Monterrey',
      city: 'Monterrey, Nuevo León',
      intro: 'Organización regiomontana con raíces en 1939 y una extensa trayectoria de campeonatos en la LMB.',
      events: [
        event('1939', 'Primeros años', 'El club debutó como Carta Blanca y comenzó la tradición profesional de Monterrey.'),
        event('1943', 'Primer campeonato', 'Bajo el nombre Industriales, el equipo obtuvo un título dirigido por Lázaro Salazar.'),
        event('1949', 'Una etapa histórica', 'El club, ya identificado como Sultanes, completó la extraordinaria secuencia de títulos de finales de los cuarenta.'),
        event('1962', 'Otro campeonato', 'Los Sultanes conquistaron un nuevo título bajo la dirección de Clemente Carrera.'),
        event('2007', 'Una nueva corona', 'La organización volvió a conquistar el campeonato de la Liga Mexicana.'),
        event('2018', 'Décimo campeonato', 'Sultanes consiguió su décima corona en la segunda temporada de 2018.')
      ],
      sources: [
        source('Sultanes · Historia de 1939', 'https://www.milb.com/news/sultanes-de-monterrey-celebra-81-anos-de-grandeza'),
        source('LMB · Campeonatos de Sultanes', 'https://www.milb.com/news/previa-equipo-renovado-en-la-sultana-del-norte'),
        lmbChampions
      ]
    },
    {
      id: 'toros',
      code: 'TIJ',
      name: 'Toros de Tijuana',
      city: 'Tijuana, Baja California',
      intro: 'Club fronterizo con una primera etapa en 2004 y una etapa continua a partir de 2014.',
      events: [
        event('2004', 'Primera participación', 'Tijuana recibió una franquicia de la LMB bajo el nombre Toros, en una primera etapa de una temporada.'),
        event('2014', 'Regreso a la LMB', 'La franquicia volvió al circuito y estableció una nueva etapa del béisbol profesional tijuanense.'),
        event('2017', 'Primera gran corona de la nueva etapa', 'Toros conquistó el campeonato de la Liga Mexicana.'),
        event('2021', 'Segundo campeonato', 'Tijuana volvió a coronarse y consolidó su protagonismo en el circuito.')
      ],
      sources: [
        source('Toros · Historia de la franquicia', 'https://www.milb.com/news/toros-arbol-genealogico-de-la-embestida'),
        source('Toros · Trayectoria en Tijuana', 'https://www.milb.com/news/toros-tijuana-hace-camino-al-andar')
      ]
    },
    {
      id: 'charros',
      code: 'JAL',
      name: 'Charros de Jalisco',
      city: 'Guadalajara, Jalisco',
      intro: 'Nombre histórico del béisbol jalisciense, con distintas etapas en la LMB y regreso al circuito de verano en 2024.',
      events: [
        event('1949', 'Primera etapa en la LMB', 'Jalisco participó en el circuito durante una etapa que se extendió hasta 1952.'),
        event('1967', 'Campeonato', 'Los Charros conquistaron un título de la LMB durante su segunda gran etapa.'),
        event('1971', 'Nueva corona', 'Jalisco volvió a coronarse tras una memorable serie final.'),
        event('1991', 'Tercera etapa', 'El nombre Charros regresó a la Liga Mexicana en una etapa que continuó hasta 1995.'),
        event('2024', 'Regreso al béisbol de verano', 'La organización anunció su participación en la Liga Mexicana de Beisbol.')
      ],
      sources: [
        source('LMB · El regreso de Charros', 'https://www.milb.com/news/charros-jalisco-tendra-pelota-todo-el-ano-participara-en-la-liga-mexicana-de-beisbol'),
        lmbChampions
      ]
    },
    {
      id: 'acereros',
      code: 'MVA',
      name: 'Acereros de Monclova',
      city: 'Monclova, Coahuila',
      intro: 'Tradición profesional de Monclova que nació en la LMB bajo otras denominaciones antes de adoptar el nombre Acereros.',
      events: [
        event('1974', 'Monclova llega a la LMB', 'La ciudad recibió al club conocido como Mineros de Coahuila, antecedente de la organización.'),
        event('1980', 'Identidad Acereros', 'Tras otras denominaciones, el equipo comenzó a utilizar el nombre Acereros de Monclova.'),
        event('2019', 'Primer campeonato', 'La novena monclovense obtuvo el primer campeonato de su historia.'),
        event('2019', 'Memoria del club', 'Una exposición histórica celebró la trayectoria del béisbol profesional de Monclova y su primera corona.')
      ],
      sources: [
        source('Acereros · Llegada a Monclova', 'https://www.milb.com/news/acereros-monclova-se-convierte-en-plaza-de-lmb'),
        source('Acereros · Historia y exposición', 'https://www.milb.com/news/ultimos-dias-de-la-exposicion-acereros-45-anos-sobre-el-diamante')
      ]
    },
    {
      id: 'algodoneros',
      code: 'UL',
      name: 'Algodoneros de Unión Laguna',
      city: 'Torreón, Coahuila',
      intro: 'Una de las identidades tradicionales del béisbol de la Comarca Lagunera.',
      events: [
        event('1940', 'Nace Algodoneros', 'El equipo fue fundado con el nombre Algodoneros de Unión Laguna.'),
        event('1942', 'Primera corona', 'Con Martín Dihigo como figura central, el club conquistó el campeonato de la LMB.'),
        event('1950', 'Segundo título', 'Unión Laguna ganó otra corona al superar a los Charros de Jalisco.'),
        event('2018', 'Regreso al nombre histórico', 'La organización recuperó la denominación Algodoneros de Unión Laguna.')
      ],
      sources: [
        source('Algodoneros · Regreso a sus orígenes', 'https://www.milb.com/news/regresan-los-algodoneros-union-laguna'),
        lmbChampions
      ]
    },
    {
      id: 'saraperos',
      code: 'SAL',
      name: 'Saraperos de Saltillo',
      city: 'Saltillo, Coahuila',
      intro: 'Club de gran tradición en la LMB desde 1970, identificado con la ciudad de Saltillo.',
      events: [
        event('1970', 'Debut en la LMB', 'Saraperos comenzó su camino con una victoria ante Sultanes de Monterrey.'),
        event('1980', 'Primer campeonato', 'Saltillo obtuvo su primera corona de la Liga Mexicana.'),
        event('2009', 'Título de liga', 'Los Saraperos conquistaron una nueva corona ante Tigres de Quintana Roo.'),
        event('2010', 'Bicampeonato', 'El club repitió el campeonato al vencer a Pericos de Puebla.'),
        event('2025', '55 años de historia', 'La organización conmemoró 55 años desde su debut en el circuito.')
      ],
      sources: [
        source('Saraperos · 55 aniversario', 'https://www.milb.com/news/saraperos-la-historia-continua-55-aniversario'),
        source('Saraperos · Memoria histórica', 'https://www.milb.com/news/saraperos-una-gran-historia-que-cumple-53-anos')
      ]
    },
    {
      id: 'rieleros',
      code: 'AGS',
      name: 'Rieleros de Aguascalientes',
      city: 'Aguascalientes, Aguascalientes',
      intro: 'Organización ligada al crecimiento del béisbol de la LMB en Aguascalientes.',
      events: [
        event('1975', 'Llegada al circuito', 'Los Rieleros ingresaron a la Liga Mexicana de Beisbol.'),
        event('1978', 'Campeonato histórico', 'Aguascalientes conquistó su título de liga bajo la dirección de Jaime Fabela.'),
        event('2018', 'Competencia en la Zona Norte', 'La novena mantuvo su presencia en el circuito de verano y su rivalidad con clubes del norte.'),
        event('2019', 'Recuerdo del campeonato', 'Una publicación histórica de la liga recuperó la trayectoria del equipo y su corona de 1978.')
      ],
      sources: [
        source('LMB · Aguascalientes en la liga', 'https://www.milb.com/news/gcs-307593148'),
        lmbChampions
      ]
    },
    {
      id: 'tecolotes',
      code: 'DOS',
      name: 'Tecolotes de los Dos Laredos',
      city: 'Nuevo Laredo / Laredo',
      intro: 'Organización fronteriza reconocida por su tradición beisbolera a ambos lados de la frontera.',
      events: [
        event('1953', 'Campeonato', 'Tecolotes obtuvo una de las primeras coronas de su historia.'),
        event('1954', 'Segundo título seguido', 'La novena volvió a conquistar el campeonato de liga.'),
        event('1958', 'Otra corona', 'El equipo consiguió su tercer campeonato de la década.'),
        event('1977', 'Nueva etapa ganadora', 'Tecolotes ganó el título de la LMB bajo la dirección de Jorge Fitch.'),
        event('1989', 'Quinta corona', 'Dos Laredos obtuvo un nuevo campeonato ante Leones de Yucatán.'),
        event('2018', 'Béisbol en dos ciudades', 'La organización disputó su calendario en sedes de Nuevo Laredo y Laredo.')
      ],
      sources: [
        source('Tecolotes · Cinco títulos', 'https://www.milb.com/news/lmb-los-mejores-por-temporada-y-posicion-de-tecolotes'),
        source('Tecolotes · Temporada 2018', 'https://www.milb.com/news/comienza-la-fiesta-de-los-playoffs-para-dos-laredos'),
        lmbChampions
      ]
    },
    {
      id: 'caliente',
      code: 'DGO',
      name: 'Caliente de Durango',
      city: 'Durango, Durango',
      intro: 'Identidad presentada en 2024 para una nueva etapa del béisbol profesional en Durango.',
      events: [
        event('2024', 'Presentación oficial', 'Caliente de Durango fue presentado como la nueva franquicia de la ciudad.'),
        event('2024', 'Estadio Francisco Villa', 'El recinto duranguense recibió al club durante su primera pretemporada.'),
        event('2024', 'Primera victoria', 'La nueva identidad consiguió un triunfo inaugural ante Saraperos de Saltillo.'),
        event('2024', 'Debut en la temporada', 'Luis Borges dirigió al equipo en el arranque de esta etapa en la LMB.')
      ],
      sources: [
        source('Caliente · Presentación oficial', 'https://www.milb.com/news/caliente-presentan-oficialmente-a-caliente-de-durango'),
        source('Caliente · Primera victoria', 'https://www.milb.com/news/caliente-consigue-durango-victoria'),
        source('Caliente · Estadio y pretemporada', 'https://www.milb.com/news/caliente-debut-en-casa-con-gran-asistencia')
      ]
    },
    {
      id: 'dorados',
      code: 'CHIH',
      name: 'Dorados de Chihuahua',
      city: 'Chihuahua, Chihuahua',
      intro: 'Nombre de varias etapas del béisbol profesional de Chihuahua dentro de la Liga Mexicana.',
      events: [
        event('2010', 'Cierre de una etapa', 'La etapa anterior del club terminó antes de una ausencia prolongada del circuito.'),
        event('2023', 'Anuncio del regreso', 'La organización confirmó su retorno a la Liga Mexicana para la temporada siguiente.'),
        event('2024', 'Cuarta etapa en la liga', 'Dorados regresó al circuito veraniego después de catorce años.'),
        event('2024', 'Estadio Monumental', 'La organización anunció el Estadio Monumental como sede de sus partidos de local.')
      ],
      sources: [
        source('Dorados · Regreso a la LMB', 'https://www.milb.com/news/dorados-regresan-a-la-liga-mexicana-de-beisbol'),
        source('LMB · Cuarta etapa de Dorados', 'https://www.milb.com/news/previa-el-monumental-regreso-de-los-dorados')
      ]
    }
  ];

  // Proteger textos al crear HTML.
  function escape(value) {
    return String(value ?? '').replace(
      /[&<>"']/g,
      character => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      })[character]
    );
  }

  // Renderizar una línea del tiempo.
  function renderTimeline(element, events) {
    if (!element) return;

    element.innerHTML = events.map(item => `
      <article class="history-event">
        <span class="history-year">${escape(item.year)}</span>
        <div class="history-event-card">
          <div class="timeline-image">
            <img
              src="${escape(item.image)}"
              alt=""
              loading="lazy"
              onerror="this.onerror=null;this.src='assets/history/1939.png'"
            >
            <span>Imagen ilustrativa</span>
          </div>
          <div class="history-event-copy">
            <h3>${escape(item.title)}</h3>
            <p>${escape(item.text)}</p>
          </div>
        </div>
      </article>
    `).join('');
  }

  // Mostrar enlaces de fuentes.
  function renderSources(element, sources) {
    if (!element) return;

    element.innerHTML = sources.map(item => `
      <li>
        <a href="${escape(item.url)}"
           target="_blank" rel="noopener noreferrer">
          ${escape(item.label)} ↗
        </a>
      </li>
    `).join('');
  }

  // Página de historia general.
  if ($('[data-baseball-timeline]')) {
    renderTimeline(
      $('[data-baseball-timeline]'),
      baseball.events
    );
    renderSources(
      $('[data-baseball-sources]'),
      baseball.sources
    );
  }

  // Página de equipos.
  const grid = $('[data-teams-grid]');

  if (!grid) return;

  const teamId = new URLSearchParams(location.search).get('team');
  const detail = $('[data-team-detail]');
  const list = $('[data-teams-list]');
  const hero = $('[data-teams-hero]');
  const error = $('[data-team-error]');

  if (!teamId) {
    grid.innerHTML = teams.map(team => `
      <a class="history-team-card"
         href="historia-equipo.html?team=${encodeURIComponent(team.id)}"
         aria-label="Ver historia de ${escape(team.name)}">
        <div class="history-team-logo" aria-hidden="true">
          ${escape(team.code)}
        </div>
        <h3>${escape(team.name)}</h3>
        <p>${escape(team.city)}</p>
      </a>
    `).join('');

    return;
  }

  const team = teams.find(item => item.id === teamId);

  if (!team) {
    if (list) list.hidden = true;
    if (hero) hero.hidden = true;
    if (error) error.hidden = false;
    return;
  }

  // Mostrar exclusivamente la historia seleccionada.
  if (list) list.hidden = true;
  if (hero) hero.hidden = true;
  if (detail) detail.hidden = false;

  document.title = `StrikeZone | Historia de ${team.name}`;

  $('[data-team-name]').textContent = team.name;
  $('[data-team-city]').textContent = team.city;
  $('[data-team-intro]').textContent = team.intro;
  $('[data-team-emblem]').textContent = team.code;

  renderTimeline(
    $('[data-team-timeline]'),
    team.events
  );

  renderSources(
    $('[data-team-sources]'),
    team.sources
  );
})();
