import { Database as SqlJsDatabase } from 'sql.js';
import { execute, queryOne, queryAll } from './db.js';
import { generateId } from './auth.js';

export function seedDemoData(db: SqlJsDatabase): { success: boolean; message: string } {
  const existingShows = queryOne<{ count: number }>(db, "SELECT COUNT(*) as count FROM tv_shows");
  if (existingShows && existingShows.count > 0) {
    return { success: true, message: 'Database already has TV shows.' };
  }

  const now = new Date().toISOString();

  // Fetch genre map
  const genres = queryAll<{ id: string; slug: string }>(db, "SELECT id, slug FROM genres");
  const genreMap = new Map(genres.map(g => [g.slug, g.id]));

  const shows = [
    {
      title: "Shadow Syndicate",
      slug: "shadow-syndicate",
      original_title: "Shadow Syndicate",
      overview: "An undercover federal operative infiltrates a formidable international crime syndicate in Chicago, only to discover the web of corruption reaches the highest echelons of justice.",
      full_description: "Deep in the rain-slicked underbelly of metropolitan Chicago, Special Agent Marcus Vance operates beneath an unyielding cover. When a high-stakes heist threatens to expose military-grade espionage weapons, Vance must navigate cutthroat family loyalties, ruthless underworld enforcers, and compromised law enforcement superiors. Each move is a calculated gamble where a single misstep means execution.",
      release_year: 2024,
      end_year: null,
      status: "Ongoing",
      country: "United States",
      language: "English",
      imdb_rating: 9.1,
      cast_members: "Damian Lewis, Sarah Snook, Regine Antoine, David Harbour",
      director: "Johan Renck, Denis Villeneuve",
      creator: "Taylor Sheridan",
      poster_url: "/src/assets/images/poster_shadow_syndicate_1792949466666.jpg",
      backdrop_url: "/src/assets/images/hero_tv_cyberpunk_detective_1792949465759.jpg",
      youtube_trailer_id: "dQw4w9WgXcQ",
      seo_title: "Shadow Syndicate (TV Series 2024– ) - Seasons & Episodes Guide",
      seo_meta_description: "Watch trailers and explore seasons and episodes of Shadow Syndicate, starring Damian Lewis and Sarah Snook.",
      keywords: "crime, thriller, syndicate, detective, undercover, noir",
      is_featured: 1,
      is_trending: 1,
      is_published: 1,
      genre_slugs: ["crime", "thriller", "drama"],
      seasons: [
        {
          season_number: 1,
          title: "Season 1: Deep Infiltration",
          overview: "Marcus enters the syndicate circle and proves his worth in a treacherous trial by fire.",
          episodes: [
            {
              episode_number: 1,
              title: "The Dead Drop",
              description: "A botched courier exchange forces Marcus to make an impossible choice on his first night embedded with the syndicate.",
              runtime: 58,
              video_source_type: "youtube",
              video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
            },
            {
              episode_number: 2,
              title: "Black Ice",
              description: "An unexpected raid puts the team on edge as suspicions arise regarding an internal informant.",
              runtime: 54,
              video_source_type: "youtube",
              video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
            },
            {
              episode_number: 3,
              title: "The Kingmaker",
              description: "A meeting with the shadowy European financier tests Marcus's psychological fortitude.",
              runtime: 61,
              video_source_type: "youtube",
              video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
            }
          ]
        },
        {
          season_number: 2,
          title: "Season 2: Collateral Retribution",
          overview: "The syndicate's internal civil war forces Marcus to choose between preserving his soul or finishing the mission.",
          episodes: [
            {
              episode_number: 1,
              title: "Severed Ties",
              description: "In the wake of the dockyard explosion, surviving lieutenants battle for supremacy.",
              runtime: 56,
              video_source_type: "youtube",
              video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
            },
            {
              episode_number: 2,
              title: "Ghost Protocol",
              description: "Marcus loses communication with his handler when the field bureau is attacked.",
              runtime: 59,
              video_source_type: "youtube",
              video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
            }
          ]
        }
      ]
    },
    {
      title: "Astraea's Edge",
      slug: "astraeas-edge",
      original_title: "Astraea's Edge",
      overview: "When a deep-space survey vessel detects a non-human harmonic beacon from the edge of the Kuiper belt, humanity's first intersystem crew embarks on a journey that challenges the fundamental nature of time.",
      full_description: "Set in 2188 aboard the experimental exploration frigate Astraea-IV, Commander Elena Rostova leads an elite expedition into the uncharted outer boundaries of our solar system. Confronted by mind-bending temporal distortions and ancient celestial artifacts, the crew must unravel an existential riddle before their consciousness is unmoored from reality.",
      release_year: 2023,
      end_year: null,
      status: "Ongoing",
      country: "United Kingdom",
      language: "English",
      imdb_rating: 8.9,
      cast_members: "Rebecca Ferguson, Chiwetel Ejiofor, Hiroyuki Sanada, Carrie Coon",
      director: "Alfonso Cuarón, Alex Garland",
      creator: "Jonathan Nolan",
      poster_url: "/src/assets/images/poster_cosmic_odyssey_1792949466152.jpg",
      backdrop_url: "/src/assets/images/poster_cosmic_odyssey_1792949466152.jpg",
      youtube_trailer_id: "dQw4w9WgXcQ",
      seo_title: "Astraea's Edge - Sci-Fi Mystery TV Series",
      seo_meta_description: "Explore the mysteries of Astraea's Edge. Deep space exploration drama created by Jonathan Nolan.",
      keywords: "sci-fi, space, mystery, drama, interstellar",
      is_featured: 1,
      is_trending: 1,
      is_published: 1,
      genre_slugs: ["scifi", "mystery", "drama"],
      seasons: [
        {
          season_number: 1,
          title: "Season 1: The Kuiper Signal",
          overview: "Humanity answers the first genuine cosmic beacon detected outside earth orbit.",
          episodes: [
            {
              episode_number: 1,
              title: "First Harmonics",
              description: "The Astraea-IV launches toward the heliopause amidst growing political turmoil on Earth.",
              runtime: 64,
              video_source_type: "youtube",
              video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
            },
            {
              episode_number: 2,
              title: "Event Dilation",
              description: "A navigation malfunction places the crew inside an unexpected gravity well.",
              runtime: 57,
              video_source_type: "youtube",
              video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
            }
          ]
        }
      ]
    },
    {
      title: "Crown of Shadows",
      slug: "crown-of-shadows",
      original_title: "Crown of Shadows",
      overview: "In a brutal 14th-century dynasty on the brink of collapse, an aging monarch faces conspiracies from his ambitious heirs while an occult plague ravages the frontier provinces.",
      full_description: "A dark, atmospheric historical saga chronicling the bloody feud over the Iron Scepter of Valois. As political assassinations and clandestine alliances tear the realm apart, Lady Isolde uncovers a royal conspiracy that threatens to extinguish the dynastic lineage forever.",
      release_year: 2022,
      end_year: 2024,
      status: "Completed",
      country: "France",
      language: "English",
      imdb_rating: 8.8,
      cast_members: "Mads Mikkelsen, Eva Green, Charles Dance, Florence Pugh",
      director: "Neil Marshall, Miguel Sapochnik",
      creator: "Beau Willimon",
      poster_url: "/src/assets/images/poster_dynasty_crown_1792949467363.jpg",
      backdrop_url: "/src/assets/images/poster_dynasty_crown_1792949467363.jpg",
      youtube_trailer_id: "dQw4w9WgXcQ",
      seo_title: "Crown of Shadows - Historical Drama Series",
      seo_meta_description: "Crown of Shadows series guide: episodes, cast, synopsis, and trailers.",
      keywords: "historical, royalty, drama, fantasy, dynasty",
      is_featured: 0,
      is_trending: 1,
      is_published: 1,
      genre_slugs: ["drama", "fantasy", "thriller"],
      seasons: [
        {
          season_number: 1,
          title: "Season 1: Bloodline & Ash",
          overview: "The king falls ill and the court descends into ruthless factional warfare.",
          episodes: [
            {
              episode_number: 1,
              title: "The Winter Council",
              description: "Princes and chancellors gather in the citadel under false pretenses of unity.",
              runtime: 62,
              video_source_type: "youtube",
              video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
            },
            {
              episode_number: 2,
              title: "Poisoned Chalice",
              description: "A feast turns deadly when the crown prince collapses during his toast.",
              runtime: 58,
              video_source_type: "youtube",
              video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
            }
          ]
        }
      ]
    }
  ];

  for (const s of shows) {
    const showId = generateId('show');
    let totalEpisodes = 0;
    for (const sea of s.seasons) {
      totalEpisodes += sea.episodes.length;
    }

    execute(
      db,
      `INSERT INTO tv_shows (
        id, title, slug, original_title, overview, full_description, release_year, end_year,
        status, country, language, imdb_rating, seasons_count, episodes_count, cast_members,
        director, creator, poster_url, backdrop_url, youtube_trailer_id, seo_title,
        seo_meta_description, keywords, is_featured, is_trending, is_published, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        showId, s.title, s.slug, s.original_title, s.overview, s.full_description, s.release_year, s.end_year,
        s.status, s.country, s.language, s.imdb_rating, s.seasons.length, totalEpisodes, s.cast_members,
        s.director, s.creator, s.poster_url, s.backdrop_url, s.youtube_trailer_id, s.seo_title,
        s.seo_meta_description, s.keywords, s.is_featured, s.is_trending, s.is_published, now, now
      ]
    );

    // Link genres
    for (const gSlug of s.genre_slugs) {
      const gId = genreMap.get(gSlug);
      if (gId) {
        execute(db, "INSERT INTO tv_show_genres (tv_show_id, genre_id) VALUES (?, ?)", [showId, gId]);
      }
    }

    // Insert seasons & episodes
    for (const sea of s.seasons) {
      const seasonId = generateId('sea');
      execute(
        db,
        `INSERT INTO seasons (
          id, tv_show_id, season_number, title, overview, episode_count, display_order, is_published, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [seasonId, showId, sea.season_number, sea.title, sea.overview, sea.episodes.length, sea.season_number, 1, now, now]
      );

      for (const ep of sea.episodes) {
        const episodeId = generateId('ep');
        execute(
          db,
          `INSERT INTO episodes (
            id, season_id, tv_show_id, episode_number, season_number, title, description,
            runtime_minutes, video_source_type, video_url, display_order, is_published, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            episodeId, seasonId, showId, ep.episode_number, sea.season_number, ep.title, ep.description,
            ep.runtime, ep.video_source_type, ep.video_url, ep.episode_number, 1, now, now
          ]
        );
      }
    }
  }

  return { success: true, message: `Successfully seeded ${shows.length} demo TV series with seasons and episodes.` };
}
