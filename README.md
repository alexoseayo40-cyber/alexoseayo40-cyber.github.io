# alexoseayo40-cyber.github.io

Páginas web de **FeedPlanner** (la app está en un repositorio privado aparte).

| Ruta | Qué es |
|---|---|
| `/` | Presentación y descarga de la app |
| `/r/?id=…` | Una receta, colección o semana compartida desde la app (se lee de Supabase con la clave pública) |
| `/a/?c=CÓDIGO&n=Nombre` | Invitación de amistad |
| `/.well-known/assetlinks.json` | Dice a Android que estos enlaces son de FeedPlanner: con la app instalada, se abren en ella |

`.nojekyll` hace que GitHub Pages publique también `.well-known`. No hay datos de nadie aquí: el contenido compartido vive en Supabase y solo se ve si se tiene el enlace.
