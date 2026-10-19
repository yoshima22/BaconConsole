# Design system

Os tokens estão em `src/design-system/tokens.css`: cores aprovadas, espaçamento baseado em 4 px, raios, sombras e duração de movimento. `global.css` aplica tipografia Inter/Sora, foco visível, estados desabilitados e redução de movimento.

Componentes reutilizáveis: `TopBar`, `GameCard`, `ActionButton`, `StatusBadge`, `HomeHero`, `DiscStatus` e `ControllerHints`. O estado da Home é local; `gamepadInput.ts` converte layouts Gamepad API padrão em ações semânticas.
