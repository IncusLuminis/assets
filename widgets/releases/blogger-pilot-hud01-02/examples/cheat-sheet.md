## Buttons

Режим      Переменная                  Дефолт   Координаты
─────────  ──────────────────────────  ───────  ──────────────────────────
maxi       --nc-toggle-maxi-top        -8px     от верха панели, экранные px
           --nc-toggle-maxi-left       -5px     от левого края панели

mini       --nc-toggle-mini-top        -8px     UNSCALED (÷ 0.352 → экранные)
           --nc-toggle-mini-left       -5px     UNSCALED
           --nc-toggle-mini-scale      1        множитель размера кнопки

micro      --nc-toggle-micro-top       2px      от верха панели, экранные px
           --nc-toggle-micro-left      2px      от левого края панели
           --nc-toggle-micro-scale     0.35     множитель размера кнопки

любой      --nc-toggle-top/left        —        общий fallback для всех режимов

## Titles

Режим      Переменная               Дефолт   Координаты
─────────  ───────────────────────  ───────  ──────────────────────────────────
maxi       --nc-title-maxi-top      0px      от нормального потока, экранные px
           --nc-title-maxi-left     0px      экранные px

mini       --nc-title-mini-top      0px      UNSCALED (÷ 0.352 → экранные px)
           --nc-title-mini-left     0px      UNSCALED

micro      --nc-title-micro-top     0px      экранные px
           --nc-title-micro-left    0px      экранные px

## Examples - button style
        <a href="#" class="nc-or-btn-maxi"
           style="color:      rgba(103, 246, 224, 0.921);
                  background: rgba(20,5,0,.85);
                  border:     1px solid rgba(60, 229, 255, 0.818);
                  opacity:    0.65;
                  font-size:  10px;
                  padding:    10px 10px;
                  min-width:  80px;
                  text-align: center;">ДОСЬЕ</a>