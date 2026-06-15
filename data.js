(function () {
  'use strict';

  window.__TRAVELS__ = {
    travelers: ['Javi', 'Mariam'],

    countries: {
      ID: {
        name: 'Indonesia',
        flag: 'https://flagcdn.com/w160/id.png',
        isoCode: 'ID',
        coverPhoto: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1200&q=80',
        regions: [
          { id: 'bali',    name: 'Bali',    conquered: true,  date: '2024-03' },
          { id: 'lombok',  name: 'Lombok',  conquered: false, date: null },
          { id: 'java',    name: 'Java',    conquered: false, date: null },
          { id: 'flores',  name: 'Flores',  conquered: false, date: null },
          { id: 'sulawesi',name: 'Sulawesi',conquered: false, date: null },
        ],
        visits: [
          {
            region: 'Bali',
            dateFrom: '2024-03-10',
            dateTo: '2024-03-24',
            photos: [
              'https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=800&q=80',
              'https://images.unsplash.com/photo-1604928141064-207cea6f571f?w=800&q=80',
              'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=800&q=80',
              'https://images.unsplash.com/photo-1573790387438-4da905039392?w=800&q=80',
            ],
            videos: [],
            restaurants: [
              { name: 'Locavore',         city: 'Ubud',     cuisine: 'New Indonesian',          rating: 5, note: 'La mejor experiencia gastronómica del viaje. Menú degustación con ingredientes locales de temporada.' },
              { name: 'Mozaic Restaurant',city: 'Ubud',     cuisine: 'French–Indonesian Fusion', rating: 5, note: 'Jardín tropical al atardecer. El wagyu local y el ceviche de mango, imprescindibles.' },
              { name: 'Merah Putih',      city: 'Seminyak', cuisine: 'Modern Indonesian',        rating: 4, note: 'Arquitectura espectacular. Probar el rendang de buey y el nasi goreng royal.' },
              { name: 'La Lucciola',      city: 'Seminyak', cuisine: 'Mediterranean',            rating: 4, note: 'Vistas al océano Índico desde el acantilado. Perfecto para el atardecer.' },
              { name: "Naughty Nuri's",   city: 'Ubud',     cuisine: 'BBQ & Warung',             rating: 4, note: 'Las costillas son legendarias. Local ruidoso y auténtico, pide con antelación.' },
            ],
            highlights: ['Templo Uluwatu al atardecer','Terrazas de arroz de Tegalalang','Ceremonia Kecak','Rafting río Ayung'],
          },
        ],
      },

      ES: {
        name: 'España',
        flag: 'https://flagcdn.com/w160/es.png',
        isoCode: 'ES',
        coverPhoto: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=80',
        regions: [
          { id: 'andalucia', name: 'Andalucía', conquered: true,  date: '2023-09' },
          { id: 'madrid',    name: 'Madrid',    conquered: true,  date: '2022-05' },
          { id: 'cataluna',  name: 'Cataluña',  conquered: false, date: null },
          { id: 'pais-vasco',name: 'País Vasco',conquered: false, date: null },
        ],
        visits: [
          {
            region: 'Andalucía',
            dateFrom: '2023-09-02', dateTo: '2023-09-10',
            photos: ['https://images.unsplash.com/photo-1556268977-df1f1fa1a67b?w=800&q=80'],
            videos: [],
            restaurants: [
              { name: 'El Faro',  city: 'Cádiz',  cuisine: 'Mariscos',    rating: 5, note: 'El mejor atún de almadraba del sur. Reservar con meses de antelación.' },
              { name: 'Diverxo',  city: 'Madrid', cuisine: 'Vanguardia',  rating: 5, note: 'Tres estrellas Michelin. Universo propio. Una vez en la vida.' },
            ],
            highlights: ['Alhambra de Granada','Semana Gastronómica de Cádiz','Flamenco en Sevilla'],
          },
        ],
      },

      MA: {
        name: 'Marruecos',
        flag: 'https://flagcdn.com/w160/ma.png',
        isoCode: 'MA',
        coverPhoto: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=1200&q=80',
        regions: [
          { id: 'marrakech', name: 'Marrakech', conquered: true,  date: '2023-12' },
          { id: 'merzouga',  name: 'Merzouga',  conquered: true,  date: '2023-12' },
          { id: 'fez',       name: 'Fez',       conquered: true,  date: '2024-01' },
          { id: 'chefchaouen',name:'Chefchaouen',conquered: false, date: null },
          { id: 'agadir',    name: 'Agadir',    conquered: false, date: null },
        ],
        visits: [
          {
            region: 'Marrakech & Merzouga',
            dateFrom: '2023-12-27', dateTo: '2024-01-03',
            photos: [
              'https://images.unsplash.com/photo-1548017796-2ae1b6d8cfb5?w=800&q=80',
              'https://images.unsplash.com/photo-1560984791-d308c29680e7?w=800&q=80',
            ],
            videos: [],
            restaurants: [
              { name: 'Le Jardin', city: 'Marrakech', cuisine: 'Marroquí Moderno', rating: 5, note: 'Riad con jardín exuberante. La pastilla de pichón es irrepetible.' },
              { name: 'Nomad',     city: 'Marrakech', cuisine: 'Rooftop Marroquí', rating: 4, note: 'Vistas a la medina desde la azotea. El ceviche de cigalas con harissa sorprende.' },
            ],
            highlights: ['Desierto del Sahara en Merzouga','Medina de Fez','Jardines de la Menara al amanecer'],
          },
        ],
      },

      FR: {
        name: 'Francia',
        flag: 'https://flagcdn.com/w160/fr.png',
        isoCode: 'FR',
        coverPhoto: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200&q=80',
        regions: [
          { id: 'paris',     name: 'París',     conquered: true,  date: '2022-06' },
          { id: 'provence',  name: 'Provenza',  conquered: false, date: null },
          { id: 'bordeaux',  name: 'Burdeos',   conquered: false, date: null },
        ],
        visits: [
          {
            region: 'París',
            dateFrom: '2022-06-14', dateTo: '2022-06-19',
            photos: ['https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800&q=80'],
            videos: [],
            restaurants: [
              { name: "L'Ambroisie", city: 'París', cuisine: 'Alta Cocina Francesa', rating: 5, note: 'Tres estrellas en Place des Vosges. Soufflé de trufas negras. Perfecto.' },
              { name: 'Septime',     city: 'París', cuisine: 'Bistronomie',          rating: 5, note: 'Reserva semanas antes. El menú cambia cada día. Siempre brillante.' },
            ],
            highlights: ["Musée d'Orsay","Le Marais al amanecer","Boucherie du Commerce"],
          },
        ],
      },

      IT: {
        name: 'Italia',
        flag: 'https://flagcdn.com/w160/it.png',
        isoCode: 'IT',
        coverPhoto: 'https://images.unsplash.com/photo-1523531294919-4bcd7c65e216?w=1200&q=80',
        regions: [
          { id: 'sicilia',  name: 'Sicilia',  conquered: true,  date: '2023-05' },
          { id: 'toscana',  name: 'Toscana',  conquered: false, date: null },
          { id: 'napoles',  name: 'Nápoles',  conquered: false, date: null },
          { id: 'roma',     name: 'Roma',     conquered: false, date: null },
        ],
        visits: [
          {
            region: 'Sicilia',
            dateFrom: '2023-05-01', dateTo: '2023-05-08',
            photos: ['https://images.unsplash.com/photo-1535399831218-d5bd36d1a6b3?w=800&q=80'],
            videos: [],
            restaurants: [
              { name: 'Duomo', city: 'Ragusa Ibla', cuisine: 'Siciliana de Autor', rating: 5, note: 'Ciccio Sultano. Dos estrellas. El arancino de langosta reinventado es un icono.' },
            ],
            highlights: ['Valle dei Templi','Etna al amanecer','Mercado de Ballarò en Palermo'],
          },
        ],
      },

      PT: {
        name: 'Portugal',
        flag: 'https://flagcdn.com/w160/pt.png',
        isoCode: 'PT',
        coverPhoto: 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=1200&q=80',
        regions: [
          { id: 'lisboa',   name: 'Lisboa',   conquered: true,  date: '2024-04' },
          { id: 'alentejo', name: 'Alentejo', conquered: true,  date: '2024-04' },
          { id: 'oporto',   name: 'Oporto',   conquered: false, date: null },
          { id: 'algarve',  name: 'Algarve',  conquered: false, date: null },
        ],
        visits: [
          {
            region: 'Lisboa & Alentejo',
            dateFrom: '2024-04-18', dateTo: '2024-04-24',
            photos: ['https://images.unsplash.com/photo-1513735492246-483525079686?w=800&q=80'],
            videos: [],
            restaurants: [
              { name: 'Belcanto',       city: 'Lisboa', cuisine: 'Portuguesa de Vanguardia', rating: 5, note: 'José Avillez. Dos estrellas Michelin. El bacalhau revisitado emociona.' },
              { name: 'Tasca do Chico', city: 'Lisboa', cuisine: 'Fado & Petiscos',           rating: 5, note: 'Fado auténtico, mesa de mármol y vino verde. La Lisboa de verdad.' },
            ],
            highlights: ['Quinta do Crasto al atardecer','Sintra en bicicleta','Pastéis de Belém a las 8am'],
          },
        ],
      },

      GR: {
        name: 'Grecia',
        flag: 'https://flagcdn.com/w160/gr.png',
        isoCode: 'GR',
        coverPhoto: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1200&q=80',
        regions: [
          { id: 'santorini', name: 'Santorini', conquered: true,  date: '2022-08' },
          { id: 'atenas',    name: 'Atenas',    conquered: true,  date: '2022-08' },
          { id: 'creta',     name: 'Creta',     conquered: false, date: null },
          { id: 'mykonos',   name: 'Mykonos',   conquered: false, date: null },
        ],
        visits: [
          {
            region: 'Santorini & Atenas',
            dateFrom: '2022-08-05', dateTo: '2022-08-14',
            photos: ['https://images.unsplash.com/photo-1533105079780-92b9be482077?w=800&q=80'],
            videos: [],
            restaurants: [
              { name: 'Selene', city: 'Santorini', cuisine: 'Griega Contemporánea', rating: 5, note: 'Vistas a la caldera. El tartar de tomate fava con huevas de pescado es legendario.' },
            ],
            highlights: ['Oia al atardecer','Acrópolis','Mercado Monastiraki'],
          },
        ],
      },

      TR: {
        name: 'Turquía',
        flag: 'https://flagcdn.com/w160/tr.png',
        isoCode: 'TR',
        coverPhoto: 'https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?w=1200&q=80',
        regions: [
          { id: 'estambul',  name: 'Estambul',  conquered: true,  date: '2023-04' },
          { id: 'capadocia', name: 'Capadocia', conquered: true,  date: '2023-04' },
          { id: 'costa-egeo',name: 'Costa Egea',conquered: false, date: null },
          { id: 'antalya',   name: 'Antalya',   conquered: false, date: null },
        ],
        visits: [
          {
            region: 'Estambul & Capadocia',
            dateFrom: '2023-04-07', dateTo: '2023-04-15',
            photos: ['https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800&q=80'],
            videos: [],
            restaurants: [
              { name: 'Mikla',            city: 'Estambul', cuisine: 'New Nordic–Anatolian', rating: 5, note: 'Azotea con vistas al Bósforo. Mehmet Gürs reinterpreta Anatolia. Imprescindible.' },
              { name: 'Karaköy Lokantası',city: 'Estambul', cuisine: 'Meyhane Turco',        rating: 4, note: 'Mezzes infinitos y rakı. El ambiente del domingo es especial.' },
            ],
            highlights: ['Globos al amanecer en Göreme','Hagia Sofía','Bazar de las Especias','Ferry al Bósforo'],
          },
        ],
      },

      JP: {
        name: 'Japón',
        flag: 'https://flagcdn.com/w160/jp.png',
        isoCode: 'JP',
        coverPhoto: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1200&q=80',
        regions: [
          { id: 'tokio',   name: 'Tokio',   conquered: true,  date: '2024-11' },
          { id: 'kioto',   name: 'Kioto',   conquered: true,  date: '2024-11' },
          { id: 'osaka',   name: 'Osaka',   conquered: true,  date: '2024-11' },
          { id: 'hiroshima',name:'Hiroshima',conquered: false, date: null },
          { id: 'nara',    name: 'Nara',    conquered: false, date: null },
          { id: 'hokkaido',name: 'Hokkaido',conquered: false, date: null },
        ],
        visits: [
          {
            region: 'Tokio, Kioto & Osaka',
            dateFrom: '2024-11-01', dateTo: '2024-11-16',
            photos: [
              'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80',
              'https://images.unsplash.com/photo-1526481280693-3bfa7568e0f3?w=800&q=80',
            ],
            videos: [],
            restaurants: [
              { name: 'Sukiyabashi Jiro Honten', city: 'Tokio', cuisine: 'Sushi Omakase',  rating: 5, note: 'El sueño de todo foodie. Reserva a través del hotel con meses de antelación.' },
              { name: 'Den',                     city: 'Tokio', cuisine: 'Kaiseki Moderno', rating: 5, note: 'Zaiyu Hasegawa reinventa la cocina japonesa con humor y profundidad. Icónico.' },
              { name: 'Kikunoi Honten',          city: 'Kioto', cuisine: 'Kaiseki Tradicional', rating: 5, note: 'Kaiseki puro en Higashiyama. Cada plato es una estación del año materializada.' },
            ],
            highlights: ['Arashiyama al amanecer','Fushimi Inari al anochecer','Tsukiji Outer Market','Shinjuku Gyoen en otoño'],
          },
        ],
      },
    },
  };
})();
