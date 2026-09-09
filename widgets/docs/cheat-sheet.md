# NebulaCast HUD — CSS vars & classes

Источник: `blogger-hud01-template.css`, `blogger-hud02-template.css`, `hud-mini.js`

Переменные на корне виджета: `nc-ol-widget` / `nc-or-widget`, атрибут `style="--nc-…"`.  
HUD-01 → `nc-ol-*`, HUD-02 → `nc-or-*`.

**Таблицы:** `Cmd+Shift+V` (Mac) / `Ctrl+Shift+V` (Win) — Markdown Preview.

---

## Размеры панели

| Режим | Включение | Размер | Как менять |
| --- | --- | --- | --- |
| maxi | нет `data-collapse` или панель без `.is-mini` | ширина 100%; `min-height` панели 420px | отдельных `--nc-*` нет |
| mini | `data-collapse="mini"` + `.is-mini` | 317×148 px | CSS `.is-mini`; JS: `panelW` 901, `scale` 0.352 |
| micro | `data-collapse="micro"` + `.is-mini` | 87×130 px (+ label) | `--nc-micro-w`, `--nc-micro-h`; классы `nc-micro-s` / `nc-micro-l` |

### Строка `.nc-hud-row`

| Режим | Правило |
| --- | --- |
| mini | `.nc-hud-row .nc-ol-widget.is-mini` → 317px |
| micro | `.nc-hud-row .nc-ol-widget[data-collapse="micro"].is-mini` → `--nc-micro-w` |
| maxi | `.nc-hud-row .nc-ol-widget:not(.is-mini)` → 100% |

---

## Toggle (▲/▼)

Селектор: `.nc-ol-panel .nc-ol-toggle-btn` (HUD-02: `.nc-or-panel` …).

| Режим | Переменная | Дефолт | Координаты |
| --- | --- | --- | --- |
| maxi | `--nc-toggle-maxi-top` | `-8px` | от верха панели, px |
| maxi | `--nc-toggle-maxi-left` | `-5px` | от левого края, px |
| mini | `--nc-toggle-mini-top` | `-8px` | UNSCALED (÷ 0.352) |
| mini | `--nc-toggle-mini-left` | `-5px` | UNSCALED |
| mini | `--nc-toggle-mini-scale` | `1` | масштаб кнопки |
| micro | `--nc-toggle-micro-top` | `2px` | px |
| micro | `--nc-toggle-micro-left` | `2px` | px |
| micro | `--nc-toggle-micro-scale` | `0.35` | масштаб кнопки |
| любой | `--nc-toggle-top` / `--nc-toggle-left` | — | fallback |
| устар. | `--nc-btn-top` / `--nc-btn-left` / `--nc-btn-scale` | — | крайний fallback |

---

## Titles — top / left

Слот: `nc-ol-title-maxi`, `nc-ol-title-mini` (`nc-or-*` на HUD-02).  
Micro: `nc-ol-title-micro` — потомок виджета, **перед** `.nc-ol-panel`.

| Режим | Переменная | Дефолт | Координаты |
| --- | --- | --- | --- |
| maxi | `--nc-title-maxi-top` | `0px` | `position: relative`, px |
| maxi | `--nc-title-maxi-left` | `0px` | px |
| mini | `--nc-title-mini-top` | `0px` | UNSCALED (÷ 0.352) |
| mini | `--nc-title-mini-left` | `0px` | UNSCALED |
| micro | `--nc-title-micro-top` | `0px` | px |
| micro | `--nc-title-micro-left` | `0px` | px |

Дефолт в слоте: `30px`, `#8ff6ff`, центр через `margin: 0 auto`.

---

## Text — align, color, font

Слот: `.nc-hud-01-html-slot` / `.nc-hud-02-html-slot`. В релизе нет `--nc-text-*`.

| Элемент | Режим | align | font / color | vars |
| --- | --- | --- | --- | --- |
| `p` | maxi, mini | слева | Share Tech Mono 12px, `rgba(190,250,255,0.78)` | нет |
| `h2` | maxi, mini | слева | 17px, `rgba(130,245,255,0.92)` | нет |
| `th`, `td` | maxi, mini | left | 11–12px | нет |
| `nc-ol-title-maxi` / `-mini` | maxi, mini | центр | 30px, `#8ff6ff` | только title top/left |
| `nc-ol-title-micro` | micro | center | 11px, ellipsis | title-micro vars |

### Staging (свой CSS в шаблоне)

| Переменная | Назначение |
| --- | --- |
| `--nc-text-top` | смещение текста |
| `--nc-text-left` | |
| `--nc-text-width` | |
| `--nc-text-color` | |
| `--nc-text-font` | |
| `--nc-text-size` | |
| `--nc-text-style` | |

---

## Video (ролик в слоте)

На **корне виджета** `nc-ol-widget` / `nc-or-widget` — значения в px/%, **не** `var()` на дочернем блоке.  
CSS шаблона читает vars и применяет к `.nc-hud-media`.

| Режим | top / left | width / height |
| --- | --- | --- |
| **maxi** | `--nc-video-maxi-top`, `--nc-video-maxi-left` | `--nc-video-maxi-width` (дефолт 100% для 16:9; для TikTok — ширина контейнера, высота авто 9:16), `--nc-video-maxi-height` (HeyGen/обычное вертикальное видео → 300px, задаёт `--nc-vertical-video-h`) |
| **mini** | `--nc-video-mini-top`, `--nc-video-mini-left` | `--nc-video-mini-width` (`auto`), `--nc-video-mini-height` (`100%`) |
| **micro** | `--nc-video-micro-top`, `--nc-video-micro-left` | `--nc-video-micro-width`, `--nc-video-micro-height` (дефолт ≈ `--nc-micro-h`) |
| fallback | `--nc-video-top`, `--nc-video-left` | `--nc-video-width`, `--nc-video-height` |

Пример (**правильно** — vars на корне):

```html
<div class="nc-hud-01 nc-ol-widget" data-mode="html"
     style="--nc-video-maxi-top: 4px;
            --nc-video-maxi-left: -12px;
            --nc-video-maxi-height: 280px;">

  …
  <div class="nc-hud-media nc-hud-media-vertical nc-hud-media-tiktok">
    <blockquote class="tiktok-embed" …></blockquote>
  </div>
</div>
```

**Неправильно:** `height: var(200px)` — в `var()` только **имя** переменной.  
**Не нужно** дублировать `var(--nc-video-…)` на `.nc-hud-media` — staging так больше не генерирует.

**Staging:** для YouTube / HeyGen / Shorts / TikTok в `style` виджета попадают `--nc-video-*` (чекбоксы **Video** + дефолты режима). Меняйте числа на корне: `--nc-video-micro-height: 200px;`.

### HeyGen (9:16, iframe)

| | |
| --- | --- |
| Разметка | `nc-hud-vertical-maxi` + `nc-hud-media-vertical` + `nc-hud-vertical-copy` |
| Алиасы | `nc-hud-heygen-maxi`, `nc-hud-heygen-copy` (то же поведение) |
| Embed | `https://share.heygen.com/embed/HEYGEN_VIDEO_ID` или `https://app.heygen.com/embeds/…` |
| Video vars | **да** — `--nc-video-*` на корне виджета |
| Высота 9:16 | `--nc-video-maxi-height: 300px` → `--nc-vertical-video-h`, ширина ≈ height×9/16 |

```html
<div class="nc-hud-01 nc-ol-widget" data-mode="html"
     style="--nc-video-maxi-top: 0px; --nc-video-maxi-left: 0px;
            --nc-video-maxi-height: 300px;">

  <div class="nc-hud-01-html-slot">
    <h2 class="nc-ol-title-maxi">АГЕНТ СВЯЗИ</h2>

    <div class="nc-hud-vertical-maxi">
      <div class="nc-hud-media nc-hud-media-vertical">
        <iframe src="https://share.heygen.com/embed/HEYGEN_VIDEO_ID"
                allow="autoplay; encrypted-media; fullscreen" allowfullscreen></iframe>
      </div>
      <div class="nc-hud-vertical-copy">
        <p>Текст справа в maxi и mini.</p>
      </div>
    </div>
  </div>
</div>
```

| Режим | Поведение |
| --- | --- |
| maxi | видео слева (фикс. высота), copy справа; панель ≈ video + 20px |
| mini | видео ~40% ширины слота + copy; `--nc-video-mini-*` |
| micro | только `.nc-hud-media`; copy скрыт; `--nc-video-micro-*` |

### TikTok (9:16, facade + /embed/v2/)

| | |
| --- | --- |
| Разметка | тот же `nc-hud-vertical-maxi`, на медиа добавить **`nc-hud-media-tiktok`** |
| Embed | facade (тамбнейл через oEmbed API) → клик → `<iframe src="https://www.tiktok.com/embed/v2/VIDEO_ID">` |
| Размер | **ширино-управляемый**: задай `--nc-video-maxi-width`, высота = ширина × 16/9 (авто) |
| Минимум | 200 × 356 px — меньше embed-плеер не рендерится корректно |
| Video vars maxi | `--nc-video-maxi-width` (дефолт **200px**) |
| Video vars mini | `--nc-video-mini-width`, `--nc-video-mini-height` |
| ID | из URL `tiktok.com/@user/video/7641102464179047702` |

```html
<div class="nc-hud-01 nc-ol-widget" data-mode="html" data-collapse="mini"
     style="--nc-video-maxi-width: 250px;
            --nc-video-mini-height: 100%;">

  <div class="nc-hud-01-html-slot">
    <h2 class="nc-ol-title-maxi">TIKTOK</h2>

    <div class="nc-hud-vertical-maxi">
      <!-- TikTok facade: тамбнейл + клик → embed -->
      <div class="nc-hud-media nc-hud-media-vertical nc-hud-media-tiktok">
        <div class="nc-tt-facade"
             data-tt-video="7641102464179047702"
             data-tt-cite="https://www.tiktok.com/@stellar.attractor.ru/video/7641102464179047702"
             onclick="ncTikTokFacadeClick(this,'7641102464179047702')">
          <div class="nc-tt-play" aria-hidden="true"></div>
        </div>
      </div>
      <div class="nc-hud-vertical-copy">
        <p>Текст справа (maxi / mini).</p>
      </div>
    </div>
  </div>
</div>
```

| `--nc-video-maxi-width` | Ширина | Высота (9:16) |
| --- | --- | --- |
| не задан | 200 px | 356 px |
| `250px` | 250 px | 444 px |
| `300px` | 300 px | 533 px |

| Режим | Поведение |
| --- | --- |
| maxi | видео слева (`--nc-video-maxi-width`), высота авто 9:16; панель растёт под видео |
| mini | видео ~40% ширины слота; `--nc-video-mini-width` / `--nc-video-mini-height` |
| micro | только превью по `--nc-video-micro-height` (дефолт `--nc-micro-h`); copy скрыт |

**Staging:** контент **TikTok** — чекбоксы группы **Video (ролик)**; тамбнейл подгружается через oEmbed API автоматически.

---

## Image (картинка в слоте)

Классы: **`nc-hud-float-image`** (float в maxi/mini) + **`nc-hud-slot-image`** (те же vars; staging ставит оба).  
Vars на **корне виджета** — как у Video.

| Режим | top / left | width / height |
| --- | --- | --- |
| **maxi** | `--nc-image-maxi-top`, `--nc-image-maxi-left` | `--nc-image-maxi-width` (`auto`), `--nc-image-maxi-height` (`auto`); max-width 42%, float right |
| **mini** | `--nc-image-mini-*` | дефолт высоты картинки **160px**; панель 420px × scale 0.352 → 148px; слот `inset: 48px 20px 14px` |
| **micro** | `--nc-image-micro-*` | только **фото** в слоте (`object-fit: contain`); текст/`.separator` скрыты; размер `--nc-micro-w` × `--nc-micro-h` |
| fallback | `--nc-image-top`, `--nc-image-left` | `--nc-image-width`, `--nc-image-height` |

```html
<div class="nc-hud-01 nc-ol-widget" data-mode="html" data-collapse="mini"
     style="--nc-image-mini-top: 0px;
            --nc-image-mini-left: 8px;
            --nc-image-mini-width: 120px;
            --nc-image-mini-height: 140px;">

  <div class="nc-hud-01-html-slot">
    <h2 class="nc-ol-title-maxi">ДОСЬЕ</h2>
    <img class="nc-hud-float-image nc-hud-slot-image"
         src="https://…/portrait.jpg" alt="Портрет">
    <p>Текст рядом с картинкой.</p>
  </div>
</div>
```

**Staging:** контент **Image** → `--nc-image-*` в `style` виджета (чекбоксы **Image**); без inline на `<img>`.

### Blogger: вставка через редактор (`.separator`, `float:left`)

Без классов HUD картинка всё равно **вписывается** (maxi): `max-width` блока 42%, `max-height` из `--nc-image-maxi-height` (дефолт 280px), слот `overflow-x: hidden`, панель `overflow: hidden`.

Уменьшить превью на корне виджета:

```html
<div class="nc-hud-01 nc-ol-widget" data-mode="html"
     style="--nc-image-maxi-height: 200px; --nc-image-maxi-width: 36%;">
```

**Mini:** если низ рамки обрезан — задайте меньше `--nc-image-mini-height` (дефолт 160px), например `120px`. HTML-mode передаёт `panelH: 420` в `NcHudMini` (148÷0.352).

**Micro:** в слоте только `<img>` (`object-fit: contain`, `--nc-micro-h`). Blogger: `.separator` / `<a><img></a>` — не `display:none` на обёртке (иначе фото пропадает). Класс `nc-hud-float-image` не обязателен. Обновите CSS темы из `blogger-hud01-template.css` — старый сниппет с `> *:not(.nc-hud-float-image)` ломает превью.

Лучше заменить разметку на `class="nc-hud-float-image nc-hud-slot-image"` без inline `width`/`height` на `<img>`.

---

## Buttons

`nc-ol-btn-maxi` в слоте; `nc-ol-btn-mini` / `nc-ol-btn-micro` после `</div>` панели.

| Режим | Переменная | Дефолт | Примечание |
| --- | --- | --- | --- |
| mini | `--nc-btn-mini-top` | `152px` | от верха виджета |
| mini | `--nc-btn-mini-left` | `0px` | |
| micro | `--nc-btn-micro-top` | `19px` | |
| micro | `--nc-btn-micro-left` | `0px` | |

Цвет и рамка — только inline на `<a>`.

---

## Brackets (только HUD-01)

| Элемент | Где | Дефолт CSS | vars |
| --- | --- | --- | --- |
| `nc-ol-title-brackets` | object-mode, `.nc-ol-right` | `top:116px; left:50%; width:260px` | нет |
| `::before` / `::after` | `nc-ol-title-maxi`, `-mini` | углы ±40px, 18×18px | нет |

HUD-02: `nc-or-title-brackets` нет.

```html
<div class="nc-ol-title-brackets" style="top:110px;left:48%;width:280px;"></div>
```

---

## Float-image / slot-image

| Класс | Роль |
| --- | --- |
| `nc-hud-float-image` | maxi: float right; mini: float left ~42%; micro: на весь слот |
| `nc-hud-slot-image` | те же **--nc-image-*** vars (можно без float-имени) |

Позиция и размер: секция **Image** выше.

---

## YouTube (16:9) и вертикальное видео (9:16)

| Тип | Классы | Источник | Video vars |
| --- | --- | --- | --- |
| YouTube 16:9 | `nc-hud-youtube-maxi`, `nc-hud-media-horizontal` | `youtube.com/embed/VIDEO_ID` | да (`--nc-video-*` на `.nc-hud-media`) |
| Shorts 9:16 | `nc-hud-vertical-maxi`, `nc-hud-media-vertical` | тот же embed ID | да |
| **HeyGen** 9:16 | + `nc-hud-vertical-copy` (алиас `nc-hud-heygen-*`) | HeyGen share/embed URL | да — см. **Video → HeyGen** |
| **TikTok** 9:16 | + `nc-hud-media-tiktok`, facade + `/embed/v2/` | oEmbed API | да — **`--nc-video-maxi-width`** (ширина, высота авто); см. **Video → TikTok** |

| Режим | YouTube 16:9 | HeyGen / Shorts / TikTok 9:16 |
| --- | --- | --- |
| **maxi** | iframe на всю ширину, текст под (`nc-hud-only-maxi`) | видео слева, текст справа; панель ≈ `video + 20px` |
| **mini** | только iframe; текст скрыт | видео ~40% + copy (HeyGen/TikTok — copy виден) |
| **micro** | только iframe, `--nc-micro-h` | только превью 9:16; copy скрыт |

Общие vars (HeyGen/Shorts): `--nc-vertical-video-h` ← `--nc-video-maxi-height` (default 300px), `--nc-vertical-row-h` = video + 20px.  
**TikTok**: размер задаётся через `--nc-video-maxi-width` (высота = ширина × 16/9 авто, мин. 200 × 356 px). Позиция: секция **Video** (подразделы HeyGen / TikTok).

**YouTube (landscape):**

```html
<div class="nc-hud-youtube-maxi">
  <div class="nc-hud-media nc-hud-media-horizontal">…iframe…</div>
  <div class="nc-hud-youtube-copy nc-hud-only-maxi"><p>…</p></div>
</div>
```

**YouTube Shorts (9:16, iframe)** — как HeyGen, без `nc-hud-media-tiktok`:

```html
<div class="nc-hud-vertical-maxi">
  <div class="nc-hud-media nc-hud-media-vertical">…iframe youtube…</div>
  <div class="nc-hud-vertical-copy"><p>…</p></div>
</div>
```

Полные примеры **HeyGen** и **TikTok** (разметка + `--nc-video-*`) — в секции **Video** выше.

---

## Примеры

Виджет (micro):

```html
<div class="nc-hud-01 nc-ol-widget"
     data-mode="html"
     data-collapse="micro"
     style="--nc-micro-w:87px; --nc-micro-h:130px;
            --nc-toggle-micro-top:2px; --nc-toggle-micro-left:2px;
            --nc-title-micro-top:0px; --nc-title-micro-left:6px;">
```

Текст в Blogger:

```html
<p style="text-align:justify;color:rgba(190,250,255,0.78);
          font-family:'Share Tech Mono',monospace;font-size:12px;">
```

Кнопка:

```html
<a href="#" class="nc-or-btn-maxi"
   style="color:rgba(103,246,224,.92);background:rgba(20,5,0,.85);
          border:1px solid rgba(60,229,255,.82);font-size:10px;padding:10px;
          text-align:center;">ДОСЬЕ</a>
```
