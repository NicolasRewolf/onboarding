# Vidéo de la crémaillère

Déposer ici la vidéo d'annonce (tournée avec Élise) sous le nom **`video.mp4`** :

```
public/cremaillere/video.mp4
```

Tant que le fichier n'existe pas, la page `/cremaillere` affiche un placeholder
(« Ici, très bientôt : la vidéo officielle ») — rien ne casse. Dès que le fichier
est poussé sur `main`, la vidéo passe en plein cadre, en autoplay muet avec un
bouton pour remettre le son.

Conseils : H.264/AAC (compatibilité maximale), < 20 Mo si possible (c'est servi
par Vercel à chaque visite), format paysage.
