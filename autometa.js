// ============================================================================
//      ___         __                        __       
//     /   | __  __/ /_____  ____ ___  ___  / /_____ _
//    / /| |/ / / / __/ __ \/ __ `__ \/ _ \/ __/ __ `/
//   / ___ / /_/ / /_/ /_/ / / / / / /  __/ /_/ /_/ / 
//  /_/  |_\__,_/\__/\____/_/ /_/ /_/\___/\__/\__,_/  
//
//  ⚡ AUTOMETA: Lightning-Fast Tag Grouper & Smart Playlist Generator
//  Version 1.1
// ============================================================================

// --- LOCALIZATION ---
var lang = window.GetProperty("Language", 0); // 0 = English

var STRINGS = {
    0: { // ENGLISH
        cat_app: "Appearance",
        cat_beh: "Behavior",
        cat_lang: "Language",
        cat_theme: "Theme",
        
        mode_minimal: "Minimalist (\u26A1 Icon)",
        mode_info: "Track Info (Artist/Title)",
        
        theme_dark: "Autometa Dark (Default)",
        theme_sys: "System (Foobar/Windows)",
        theme_cust: "Custom (Edit in Properties)",

        autoplay_on: "Autoplay on Group",
        autoplay_off: "Do not interrupt (List only)",
        view_group: "Tags: Grouped (Folders)",
        view_flat: "Tags: Flat List (All)",

        lang_en: "English",
        lang_es: "Spanish",
        properties: "Panel Properties...",
        
        assign_header: "\u26A1 Assigned: ",
        instr_click: "Click: Group",
        instr_shift: "Shift+Click: Set Default",
        
        meta_header: "Metadata",
        tech_header: "Tech Info",
        sys_header: "System & Stats",
        stopped: "Stopped",
        
        multi_sel: "Select value:",
        multi_comb: " (Combined)"
    },
    1: { // SPANISH
        cat_app: "Apariencia",
        cat_beh: "Comportamiento",
        cat_lang: "Idioma",
        cat_theme: "Tema",

        mode_minimal: "Minimalista (Icono \u26A1)",
        mode_info: "Info Pista (Artista/Titulo)",

        theme_dark: "Autometa Dark (Original)",
        theme_sys: "Sistema (Foobar/Windows)",
        theme_cust: "Personalizado (Editar Propiedades)",

        autoplay_on: "Auto-reproducir al agrupar",
        autoplay_off: "No interrumpir (Solo lista)",
        view_group: "Tags: Agrupados (Carpetas)",
        view_flat: "Tags: Lista Plana (Todo junto)",

        lang_en: "Inglés",
        lang_es: "Español",
        properties: "Propiedades del Panel...",

        assign_header: "\u26A1 Asignado: ",
        instr_click: "Clic: Agrupar",
        instr_shift: "Shift+Clic: Asignar Default",
        
        meta_header: "Metadatos",
        tech_header: "Info Técnica",
        sys_header: "Sistema y Estadísticas",
        stopped: "Detenido",
        
        multi_sel: "Seleccionar valor:",
        multi_comb: " (Combinado)"
    }
};

function getText(id) { return STRINGS[lang][id] || STRINGS[0][id]; }

// --- FUENTES ---
var font_bolt_big = gdi.Font("Segoe UI Emoji", 20, 1);
var font_bolt_small = gdi.Font("Segoe UI Emoji", 14, 1);
var font_ui = gdi.Font("Segoe UI Symbol", 12, 0);
var font_title = gdi.Font("Segoe UI", 12, 1);
var font_artist = gdi.Font("Segoe UI", 11, 0);

// --- COLORES ---
function RGB(r, g, b) { return (0xff000000 | (r << 16) | (g << 8) | (b)); }

function ParseColor(str) {
    try {
        var arr = str.split(",");
        if (arr.length !== 3) return RGB(0,0,0);
        return RGB(parseInt(arr[0]), parseInt(arr[1]), parseInt(arr[2]));
    } catch(e) {
        return RGB(0,0,0);
    }
}

// --- GESTIÓN DE COLORES Y TEMAS ---
// Propiedades para modo Custom (AHORA COMO TEXTO RGB)
var theme_mode = window.GetProperty("Theme Mode", 0);
var cust_bg_str = window.GetProperty("Custom Color: Background (R,G,B)", "23,23,23");
var cust_txt_str = window.GetProperty("Custom Color: Text (R,G,B)", "255,255,255");
var cust_hlt_str = window.GetProperty("Custom Color: Highlight (R,G,B)", "180,50,120");
var cust_btn_str = window.GetProperty("Custom Color: Buttons (R,G,B)", "50,50,50");

// Variables dinámicas
var c_bg, c_hover, c_btn, c_txt, c_dim;

function update_colors() {
    if (theme_mode === 0) { 
        // AUTOMETA DARK
        c_bg = RGB(23, 23, 23);
        c_hover = RGB(180, 50, 120);
        c_btn = RGB(35, 35, 35);
        c_txt = RGB(245, 245, 245);
        c_dim = RGB(160, 160, 160);
    } else if (theme_mode === 1) { 
        // SYSTEM (Auto - FIX CUI)
        try {
            if (window.InstanceType === 1) {
                c_bg = window.GetColourDUI(1); 
                c_txt = window.GetColourDUI(0);
                c_hover = window.GetColourDUI(2);
            } else {
                c_bg = window.GetColourCUI(2); 
                c_txt = window.GetColourCUI(0); 
                c_hover = window.GetColourCUI(3); 
            }
        } catch(e) {
            c_bg = RGB(255, 255, 255);
            c_txt = RGB(0, 0, 0);
            c_hover = RGB(190, 190, 190);
        }
        c_btn = (c_txt & 0x15ffffff); 
        c_dim = (c_txt & 0x90ffffff);
    } else { 
        // CUSTOM (Usando el Parser)
        c_bg = ParseColor(cust_bg_str);
        c_txt = ParseColor(cust_txt_str);
        c_hover = ParseColor(cust_hlt_str);
        c_btn = ParseColor(cust_btn_str);
        c_dim = c_txt; 
    }
}

// --- HELPERS TEXTO ---
var tf_title = fb.TitleFormat("%title%");
var tf_artist = fb.TitleFormat("%artist%");

// --- ESTADO ---
var hover_zone = 0;
var btn_width = 30;

// --- PROPIEDADES ---
var qa_field = window.GetProperty("QuickAction Field", "ALBUM ARTIST");
var qa_type = window.GetProperty("Quick Action Type", "meta");
var qa_pattern = window.GetProperty("Quick Action Pattern", "");

var display_mode = window.GetProperty("Display Mode", 1);
var auto_play = window.GetProperty("Auto Play", false); 
var viewMode = window.GetProperty("View Mode", 0);

// --- PAINT ---
function on_paint(gr) {
    update_colors(); 
    var w = window.Width;
    var h = window.Height;
    var handle = fb.GetNowPlaying();

    gr.FillSolidRect(0, 0, w, h, c_bg);

    if (display_mode === 0) {
        // === MINIMALIST ===
        gr.FillSolidRect(0, 0, w - btn_width, h, hover_zone === 1 ? c_hover : c_bg);
        gr.GdiDrawText("\u26A1", font_bolt_big, c_txt, 0, 0, w - btn_width, h, 1 | 4);
        gr.FillSolidRect(w - btn_width, 0, btn_width, h, hover_zone === 3 ? c_hover : c_btn);
        gr.GdiDrawText("\u25BC", font_ui, c_txt, w - btn_width, 0, btn_width, h, 1 | 4);
        // Divisor sutil
        if (theme_mode !== 1) gr.FillSolidRect(w - btn_width, 0, 1, h, RGB(0,0,0));
    } else {
        // === INFO TRACK ===
        gr.FillSolidRect(0, 0, btn_width, h, hover_zone === 1 ? c_hover : c_btn);
        gr.GdiDrawText("\u26A1", font_bolt_small, c_txt, 0, 0, btn_width, h, 1 | 4);
        var txt_x = btn_width + 5;
        var txt_w = w - (btn_width * 2) - 10;
        // Hover central
        if (hover_zone === 2) gr.FillSolidRect(btn_width, 0, w - (btn_width * 2), h, 0x15ffffff); 

        if (handle) {
            gr.GdiDrawText(tf_title.EvalWithMetadb(handle), font_title, c_txt, txt_x, 0, txt_w, h/2 + 2, 1 | 8 | 32768); 
            gr.GdiDrawText(tf_artist.EvalWithMetadb(handle), font_artist, c_dim, txt_x, h/2, txt_w, h/2 - 2, 1 | 4 | 32768);
        } else {
            gr.GdiDrawText(getText("stopped"), font_artist, c_dim, txt_x, 0, txt_w, h, 1 | 4);
        }

        gr.FillSolidRect(w - btn_width, 0, btn_width, h, hover_zone === 3 ? c_hover : c_btn);
        gr.GdiDrawText("\u25BC", font_ui, c_txt, w - btn_width, 0, btn_width, h, 1 | 4);
        if (theme_mode !== 1) {
            gr.FillSolidRect(btn_width, 0, 1, h, RGB(0,0,0));
            gr.FillSolidRect(w - btn_width, 0, 1, h, RGB(0,0,0));
        }
    }
}

// --- MOUSE ---
function on_mouse_move(x, y) {
    var w = window.Width;
    var prev_zone = hover_zone;
    if (display_mode === 0) {
        if (x > w - btn_width) hover_zone = 3; else hover_zone = 1;
    } else {
        if (x < btn_width) hover_zone = 1; else if (x > w - btn_width) hover_zone = 3; else hover_zone = 2;
    }
    if (prev_zone !== hover_zone) window.Repaint();
}
function on_mouse_leave() { hover_zone = 0; window.Repaint(); }
function on_mouse_lbtn_up(x, y) {
    switch (hover_zone) {
        case 1: run_quick_action(x, y); break;
        case 2: jump_to_now_playing(); break;
        case 3: show_context_menu(x, y); break;
    }
}
function on_mouse_rbtn_up(x, y) { show_config_menu(x, y); return true; }

// --- CORE ---
function jump_to_now_playing() {
    if (plman.PlayingPlaylist !== -1) {
        plman.ActivePlaylist = plman.PlayingPlaylist;
        fb.RunMainMenuCommand("View/Show now playing");
    }
}

// FIX: Añadimos 'override_opt' para forzar la opción seleccionada desde el menú
function run_quick_action(x, y, override_opt) {
    var handle = fb.GetNowPlaying();
    if (!handle) return;
    
    // Si viene del menú usa el 'override_opt', si viene del rayo usa las propiedades por defecto
    var opt = override_opt ? override_opt : { field: qa_field, type: qa_type, rawPattern: qa_pattern, value: "" };
    var isMulti = false;
    var values = [];
    
    if (opt.type === "meta") {
        var idx = handle.GetFileInfo().MetaFind(opt.field);
        if (idx !== -1) {
            var valCount = handle.GetFileInfo().MetaValueCount(idx);
            if (valCount > 1) {
                isMulti = true;
                for (var i = 0; i < valCount; i++) {
                    values.push(handle.GetFileInfo().MetaValue(idx, i));
                }
                opt.value = values.join("; "); 
            } else {
                opt.value = handle.GetFileInfo().MetaValue(idx, 0);
            }
        }
    } else if (opt.type === "tech") {
        var idx = handle.GetFileInfo().InfoFind(opt.field);
        if (idx !== -1) opt.value = handle.GetFileInfo().InfoValue(idx);
    } else if (opt.type === "system") {
        opt.value = fb.TitleFormat(opt.rawPattern).EvalWithMetadb(handle);
    }
    
    if (opt.value) {
        if (isMulti) {
            var multiMenu = window.CreatePopupMenu();
            multiMenu.AppendMenuItem(1, 0, getText("multi_sel"));
            multiMenu.AppendMenuItem(0, 0, "----------------");
            
            for (var i = 0; i < values.length; i++) {
                multiMenu.AppendMenuItem(0, i + 1, values[i]);
            }
            multiMenu.AppendMenuItem(0, 0, "----------------");
            multiMenu.AppendMenuItem(0, 99, opt.value + getText("multi_comb"));
            
            var choice = multiMenu.TrackPopupMenu(x, y);
            if (choice > 0 && choice <= values.length) {
                opt.value = values[choice - 1]; // Single selection
                create_playlist(opt);
            } else if (choice === 99) {
                create_playlist(opt, values); // Send array for combined query
            }
        } else {
            create_playlist(opt);
        }
    }
}

function create_playlist(opt, multiValues) {
    var cleanValue = String(opt.value).replace(/"/g, "'");
    var query = "";

    if (opt.type === "meta") {
        if (multiValues && multiValues.length > 1) {
            var queryParts = [];
            for(var i=0; i<multiValues.length; i++) {
                queryParts.push(opt.field + " IS \"" + String(multiValues[i]).replace(/"/g, "'") + "\"");
            }
            query = queryParts.join(" AND ");
        } else {
            query = opt.field + " IS \"" + cleanValue + "\"";
        }
    } else if (opt.type === "tech") {
        query = "%" + opt.field + "% IS \"" + cleanValue + "\"";
    } else if (opt.type === "system") {
        if (opt.field === "PATH" || opt.field === "FOLDER NAME") {
            query = "%path% HAS \"" + cleanValue + "\"";
        } else if (opt.field === "EXACT SIZE" || opt.field === "FILE SIZE") {
            query = "%filesize% IS " + cleanValue;
        } else {
            query = "\"" + opt.rawPattern + "\" IS \"" + cleanValue + "\"";
        }
    }

    var playlistName = "\uD83D\uDD0D " + opt.field + ": " + cleanValue;
    var p_idx = plman.FindPlaylist(playlistName);
    if (p_idx === -1) p_idx = plman.CreateAutoPlaylist(plman.PlaylistCount, playlistName, query);
    plman.ActivePlaylist = p_idx;
    if (auto_play) plman.ExecutePlaylistDefaultAction(p_idx, 0);
}

// --- MENUS (CONFIG) ---
function show_config_menu(x, y) {
    var cMenu = window.CreatePopupMenu();
    var subApp = window.CreatePopupMenu();
    var subTheme = window.CreatePopupMenu();
    var subBeh = window.CreatePopupMenu();
    var subLang = window.CreatePopupMenu();

    // 1. APARIENCIA
    subApp.AppendMenuItem(display_mode === 0 ? 8 : 0, 1, getText("mode_minimal"));
    subApp.AppendMenuItem(display_mode === 1 ? 8 : 0, 2, getText("mode_info"));
    subTheme.AppendMenuItem(theme_mode === 0 ? 8 : 0, 20, getText("theme_dark"));
    subTheme.AppendMenuItem(theme_mode === 1 ? 8 : 0, 21, getText("theme_sys"));
    subTheme.AppendMenuItem(theme_mode === 2 ? 8 : 0, 22, getText("theme_cust"));
    subTheme.AppendTo(cMenu, 16, getText("cat_theme")); 
    subApp.AppendTo(cMenu, 16, getText("cat_app"));

    // 2. COMPORTAMIENTO
    subBeh.AppendMenuItem(auto_play ? 8 : 0, 3, getText("autoplay_on"));
    subBeh.AppendMenuItem(!auto_play ? 8 : 0, 4, getText("autoplay_off"));
    subBeh.AppendMenuItem(0, 0, "----------------");
    subBeh.AppendMenuItem(viewMode === 0 ? 8 : 0, 5, getText("view_group"));
    subBeh.AppendMenuItem(viewMode === 1 ? 8 : 0, 6, getText("view_flat"));
    subBeh.AppendTo(cMenu, 16, getText("cat_beh"));

    // 3. IDIOMA
    subLang.AppendMenuItem(lang === 0 ? 8 : 0, 10, getText("lang_en"));
    subLang.AppendMenuItem(lang === 1 ? 8 : 0, 11, getText("lang_es"));
    subLang.AppendTo(cMenu, 16, getText("cat_lang"));

    cMenu.AppendMenuItem(0, 0, "----------------");
    cMenu.AppendMenuItem(0, 99, getText("properties"));

    var choice = cMenu.TrackPopupMenu(x, y);

    if (choice === 1) { display_mode = 0; window.SetProperty("Display Mode", 0); }
    else if (choice === 2) { display_mode = 1; window.SetProperty("Display Mode", 1); }
    else if (choice === 20) { theme_mode = 0; window.SetProperty("Theme Mode", 0); }
    else if (choice === 21) { theme_mode = 1; window.SetProperty("Theme Mode", 1); }
    else if (choice === 22) { theme_mode = 2; window.SetProperty("Theme Mode", 2); }
    else if (choice === 3) { auto_play = true; window.SetProperty("Auto Play", true); }
    else if (choice === 4) { auto_play = false; window.SetProperty("Auto Play", false); }
    else if (choice === 5) { viewMode = 0; window.SetProperty("View Mode", 0); }
    else if (choice === 6) { viewMode = 1; window.SetProperty("View Mode", 1); }
    else if (choice === 10) { lang = 0; window.SetProperty("Language", 0); }
    else if (choice === 11) { lang = 1; window.SetProperty("Language", 1); }
    else if (choice === 99) { window.ShowConfigure(); }
    
    if (choice >= 1) window.Repaint();
}

// --- MENUS (SELECTOR) ---
function show_context_menu(x, y) {
    var handle = fb.GetNowPlaying();
    if (!handle) return;
    var fileInfo = handle.GetFileInfo();
    var mainMenu = window.CreatePopupMenu();
    var validOptions = [];
    var idx = 1;

    mainMenu.AppendMenuItem(1, 0, getText("assign_header") + qa_field);
    mainMenu.AppendMenuItem(1, 0, getText("instr_click") + " | " + getText("instr_shift"));
    mainMenu.AppendMenuItem(0, 0, "---------------------------");

    function addItem(menuObj, name, value, type, rawPattern) {
        var is_default = (name === qa_field && qa_type === type);
        var label = value.length > 30 ? value.substring(0, 27) + "..." : value;
        menuObj.AppendMenuItem(is_default ? 8 : 0, idx, name + ": " + label);
        validOptions[idx] = { field: name, value: value, type: type, rawPattern: rawPattern };
        idx++;
    }

    var commonTags = ["ALBUM ARTIST", "ARTIST", "ALBUM", "GENRE", "DATE"];
    for (var c = 0; c < commonTags.length; c++) {
        var idxTag = fileInfo.MetaFind(commonTags[c]);
        if (idxTag !== -1) {
            var mCount = fileInfo.MetaValueCount(idxTag);
            var mVal = "";
            if (mCount > 1) {
                var tempArr = [];
                for(var v=0; v<mCount; v++) tempArr.push(fileInfo.MetaValue(idxTag, v));
                mVal = tempArr.join("; ");
            } else {
                mVal = fileInfo.MetaValue(idxTag, 0);
            }
            addItem(mainMenu, commonTags[c], mVal, "meta", "");
        }
    }
    mainMenu.AppendMenuItem(0, 0, "---------------------------");

    var targetMeta, targetTech, targetStat;
    if (viewMode === 0) { 
        targetMeta = window.CreatePopupMenu();
        targetTech = window.CreatePopupMenu();
        targetStat = window.CreatePopupMenu();
    } else {
        targetMeta = mainMenu; targetTech = mainMenu; targetStat = mainMenu;
        mainMenu.AppendMenuItem(1, 0, "--- " + getText("meta_header") + " ---");
    }

    // 1. Metadata
    for (var i = 0; i < fileInfo.MetaCount; i++) {
        var mName = fileInfo.MetaName(i).toUpperCase();
        var mCount = fileInfo.MetaValueCount(i);
        var mVal = "";
        if (mCount > 1) {
            var tempArr = [];
            for(var v=0; v<mCount; v++) tempArr.push(fileInfo.MetaValue(i, v));
            mVal = tempArr.join("; ");
        } else {
            mVal = fileInfo.MetaValue(i, 0);
        }
        addItem(targetMeta, mName, mVal, "meta", "");
    }

    // 2. Tech Info
    if (viewMode === 1) mainMenu.AppendMenuItem(1, 0, "--- " + getText("tech_header") + " ---");
    for (var j = 0; j < fileInfo.InfoCount; j++) {
        addItem(targetTech, fileInfo.InfoName(j).toUpperCase(), fileInfo.InfoValue(j), "tech", "");
    }

    // 3. System
    if (viewMode === 1) mainMenu.AppendMenuItem(1, 0, "--- " + getText("sys_header") + " ---");
    
    var sysTags = [
        {n: "FILE SIZE", p: "%filesize_natural%"}, {n: "EXACT SIZE", p: "%filesize%"},
        {n: "DURATION", p: "%length%"}, {n: "LAST MODIFIED", p: "%last_modified%"},
        {n: "PATH", p: "%path%"}, {n: "FILENAME", p: "%filename_ext%"},
        {n: "FOLDER NAME", p: "$directory_path(%path%)"}, {n: "REPLAYGAIN TRACK", p: "%replaygain_track_gain%"},
        {n: "REPLAYGAIN ALBUM", p: "%replaygain_album_gain%"}, {n: "EXTENSION", p: "%filename_ext%"}
    ];

    for (var k=0; k<sysTags.length; k++) {
        var val = fb.TitleFormat(sysTags[k].p).EvalWithMetadb(handle);
        if (val && val !== "?" && val !== "") addItem(targetStat, sysTags[k].n, val, "system", sysTags[k].p);
    }

    if (viewMode === 0) {
        targetMeta.AppendTo(mainMenu, 0, getText("meta_header"));
        targetTech.AppendTo(mainMenu, 0, getText("tech_header"));
        targetStat.AppendTo(mainMenu, 0, getText("sys_header"));
    }

    var choice = mainMenu.TrackPopupMenu(x, y);
    if (validOptions[choice]) {
        var opt = validOptions[choice];
        if (utils.IsKeyPressed(0x10)) { 
            qa_field = opt.field; qa_type = opt.type; qa_pattern = opt.rawPattern || "";
            window.SetProperty("QuickAction Field", qa_field);
            window.SetProperty("Quick Action Type", qa_type);
            window.SetProperty("Quick Action Pattern", qa_pattern);
            window.Repaint();
        } else {
            // FIX: Usamos setTimeout (50ms) para asegurarnos de que el primer menú ya se cerró a nivel de sistema
            // y le pasamos explícitamente el 'opt' que acabas de seleccionar.
            setTimeout(function() {
                run_quick_action(x, y, opt);
            }, 50);
        }
    }
}

function on_playback_new_track() { window.Repaint(); }
function on_playback_stop() { window.Repaint(); }