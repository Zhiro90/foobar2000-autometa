// ============================================================================
//      ___         __                        __       
//     /   | __  __/ /_____  ____ ___  ___  / /_____ _
//    / /| |/ / / / __/ __ \/ __ \__ \/ _ \/ __/ __ `/
//   / ___ / /_/ / /_/ /_/ / / / / / /  __/ /_/ /_/ / 
//  /_/  |_\__,_/\__/\____/_/ /_/ /_/\___/\__/\__,_/  
//
//  ⚡ AUTOMETA: Lightning-Fast Tag Grouper & Smart Playlist Generator
//  Version 1.3
//  Author: Zhiro90
//  Repo: https://github.com/Zhiro90/foobar2000-autometa
//  License: MIT
// ============================================================================

var SCRIPT_VERSION = 1.3;

// --- LOCALIZATION ---
var lang = window.GetProperty("Language", 0); // 0 = English

var STRINGS = {
    0: { // ENGLISH
        cat_layout: "Layout",
        cat_beh: "Behavior",
        cat_lang: "Language",
        cat_theme: "Theme",
        
        mode_minimal: "Minimalist (\u26A1 Icon)",
        mode_info: "Track Info (Artist/Title)",
        
        theme_dark: "Autometa Dark (Default)",
        theme_sys: "System (Foobar/Windows)",
        theme_cust: "Custom (Edit in Properties)",
        theme_import: "Import Theme (Clipboard)",
        theme_export: "Export Theme (Clipboard)",
        theme_msg_exp: "Theme exported to clipboard successfully!",
        theme_msg_imp_err: "Error importing theme. Please ensure you copied a valid Autometa JSON theme.",

        autoplay_on: "Autoplay on Group",
        autoplay_off: "Do not interrupt (List only)",
        list_new: "Playlists: New per search",
        list_single: "Playlists: Reuse single list",
        view_group: "Tags: Grouped (Folders)",
        view_flat: "Tags: Flat List (All)",

        lang_en: "English",
        lang_es: "Spanish",
        properties: "Panel Properties...",
        
        assign_header: "\u26A1 Assigned: ",
        act_group: "Group",
        act_autoplay: "Auto-Play",
        instr_mbtn: "Middle-Click: Toggle Layout",
        instr_shift: "Assign",
        instr_alt: "Alt + Click Icon: Inverse Behavior",
        
        meta_header: "Metadata",
        tech_header: "Tech Info",
        sys_header: "System & Stats",
        stopped: "Stopped",
        
        multi_sel: "Select value:",
        multi_comb: " (Combined)",
        tooltip_group: "Group by: ",
        ttip_empty: "Disabled (Empty)",
        ttip_focus: "Focus on playing track",

        update_check: "\uD83D\uDD04 Check for Updates...",
        update_uptodate: "You are using the latest version of Autometa (v",
        update_avail: "A new version of Autometa is available! (v",
        update_prompt: "Do you want to open the download page?",
        update_error: "Could not check for updates. Please check your connection."
    },
    1: { // SPANISH
        cat_layout: "Diseño",
        cat_beh: "Comportamiento",
        cat_lang: "Idioma",
        cat_theme: "Tema",

        mode_minimal: "Minimalista (Icono \u26A1)",
        mode_info: "Info Pista (Artista/Titulo)",

        theme_dark: "Autometa Dark (Original)",
        theme_sys: "Sistema (Foobar/Windows)",
        theme_cust: "Personalizado (Editar Propiedades)",
        theme_import: "Importar Tema (Portapapeles)",
        theme_export: "Exportar Tema (Portapapeles)",
        theme_msg_exp: "¡Tema exportado al portapapeles correctamente!",
        theme_msg_imp_err: "Error al importar el tema. Asegúrate de haber copiado un JSON de Autometa válido.",

        autoplay_on: "Auto-reproducir al agrupar",
        autoplay_off: "No interrumpir (Solo lista)",
        list_new: "Listas: Nueva por búsqueda",
        list_single: "Listas: Reutilizar lista única",
        view_group: "Tags: Agrupados (Carpetas)",
        view_flat: "Tags: Lista Plana (Todo junto)",

        lang_en: "Inglés",
        lang_es: "Español",
        properties: "Propiedades del Panel...",

        assign_header: "\u26A1 Asignado: ",
        act_group: "Agrupar",
        act_autoplay: "Auto-Play",
        instr_mbtn: "Clic-Central: Cambiar Diseño",
        instr_shift: "Asignar",
        instr_alt: "Alt + Clic Icono: Invertir Comportamiento",
        
        meta_header: "Metadatos",
        tech_header: "Info Técnica",
        sys_header: "Sistema y Estadísticas",
        stopped: "Detenido",
        
        multi_sel: "Seleccionar valor:",
        multi_comb: " (Combinado)",
        tooltip_group: "Agrupar por: ",
        ttip_empty: "Desactivado (Vacío)",
        ttip_focus: "Ir a pista actual",

        update_check: "\uD83D\uDD04 Buscar actualizaciones...",
        update_uptodate: "Estás usando la última versión de Autometa (v",
        update_avail: "¡Hay una nueva versión de Autometa disponible! (v",
        update_prompt: "¿Deseas abrir la página de descarga?",
        update_error: "No se pudo buscar la actualización. Revisa tu conexión."
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

// --- PORTAPAPELES (COM WRAPPERS) ---
function read_clipboard() {
    try {
        var doc = new ActiveXObject("htmlfile");
        return doc.parentWindow.clipboardData.getData("Text") || "";
    } catch(e) {
        return "";
    }
}

function write_clipboard(text) {
    try {
        var doc = new ActiveXObject("htmlfile");
        doc.parentWindow.clipboardData.setData("Text", text);
    } catch(e) {
        try {
            var WshShell = new ActiveXObject("WScript.Shell");
            var oExec = WshShell.Exec("clip");
            oExec.StdIn.Write(text);
            oExec.StdIn.Close();
        } catch(err) {}
    }
}

// --- GESTIÓN DE COLORES Y TEMAS ---
var theme_mode = window.GetProperty("Theme Mode", 0);

var c_action_bg, c_action_bg_dis, c_action_icon, c_action_icon_dis;
var c_info_bg, c_info_title, c_info_artist;
var c_menu_bg, c_menu_icon, c_hover;

function update_colors() {
    if (theme_mode === 0) { 
        c_info_bg = RGB(23, 23, 23);
        c_action_bg = (display_mode === 0) ? c_info_bg : RGB(35, 35, 35);
        c_action_bg_dis = (display_mode === 0) ? c_info_bg : RGB(28, 28, 28);
        c_action_icon = RGB(245, 245, 245);
        c_action_icon_dis = RGB(160, 160, 160);
        c_info_title = RGB(245, 245, 245);
        c_info_artist = RGB(160, 160, 160);
        c_menu_bg = RGB(35, 35, 35);
        c_menu_icon = RGB(245, 245, 245);
        c_hover = RGB(180, 50, 120);
    } else if (theme_mode === 1) { 
        try {
            if (window.InstanceType === 1) {
                c_info_bg = window.GetColourDUI(1); 
                c_info_title = window.GetColourDUI(0);
                c_hover = window.GetColourDUI(2);
            } else {
                c_info_bg = window.GetColourCUI(2); 
                c_info_title = window.GetColourCUI(0); 
                c_hover = window.GetColourCUI(3); 
            }
        } catch(e) {
            c_info_bg = RGB(255, 255, 255);
            c_info_title = RGB(0, 0, 0);
            c_hover = RGB(190, 190, 190);
        }
        c_action_bg = (c_info_title & 0x15ffffff); 
        c_action_bg_dis = (c_info_title & 0x0affffff);
        c_action_icon = c_info_title;
        c_action_icon_dis = (c_info_title & 0x50ffffff);
        c_info_artist = (c_info_title & 0x90ffffff);
        c_menu_bg = c_action_bg;
        c_menu_icon = c_info_title;
        
        if (display_mode === 0) {
            c_action_bg = c_info_bg;
            c_action_bg_dis = c_info_bg;
        }
    } else { 
        c_action_bg = ParseColor(window.GetProperty("Theme Custom: Action Bg", "50,50,50"));
        c_action_bg_dis = ParseColor(window.GetProperty("Theme Custom: Action Bg (Disabled)", "30,30,30"));
        c_action_icon = ParseColor(window.GetProperty("Theme Custom: Action Icon", "255,255,255"));
        c_action_icon_dis = ParseColor(window.GetProperty("Theme Custom: Action Icon (Disabled)", "130,130,130"));
        c_info_bg = ParseColor(window.GetProperty("Theme Custom: Info Bg", "23,23,23"));
        c_info_title = ParseColor(window.GetProperty("Theme Custom: Info Title", "255,255,255"));
        c_info_artist = ParseColor(window.GetProperty("Theme Custom: Info Artist", "255,24,98"));
        c_menu_bg = ParseColor(window.GetProperty("Theme Custom: Menu Btn Bg", "50,50,50"));
        c_menu_icon = ParseColor(window.GetProperty("Theme Custom: Menu Icon", "255,255,255"));
        c_hover = ParseColor(window.GetProperty("Theme Custom: Highlight (Hover)", "180,50,120"));
    }
}

// --- HELPERS TEXTO ---
var tf_title = fb.TitleFormat("%title%");
var tf_artist = fb.TitleFormat("%artist%");

// --- PROPIEDADES ---
var qa_field = window.GetProperty("QuickAction Field", "ALBUM ARTIST");
var qa_type = window.GetProperty("Quick Action Type", "meta");
var qa_pattern = window.GetProperty("Quick Action Pattern", "");

var display_mode = window.GetProperty("Display Mode", 1);
var auto_play = window.GetProperty("Auto Play", false); 
var viewMode = window.GetProperty("View Mode", 0);
var single_playlist = window.GetProperty("Single Playlist Mode", false);

// --- ESTADO Y TOOLTIP ---
var hover_zone = 0;
var btn_width = 30;
var ttip = window.CreateTooltip();
var ttip_alt_state = false;

// --- UPDATER ---
function check_for_updates() {
    var url = "https://raw.githubusercontent.com/Zhiro90/foobar2000-autometa/main/autometa.js";
    try {
        var xmlhttp = new ActiveXObject("WinHttp.WinHttpRequest.5.1");
        xmlhttp.Open("GET", url, false);
        xmlhttp.SetRequestHeader("User-Agent", "Autometa_Foobar2000");
        xmlhttp.SetTimeouts(3000, 3000, 3000, 3000);
        xmlhttp.Send();
        
        if (xmlhttp.Status === 200) {
            var text = xmlhttp.ResponseText;
            var match = text.match(/Version\s+([\d\.]+)/i);
            
            if (match) {
                var online_ver = parseFloat(match[1]);
                var WshShell = new ActiveXObject("WScript.Shell");
                
                if (online_ver > SCRIPT_VERSION) {
                    var msg = getText("update_avail") + online_ver + ").\n\n" + getText("update_prompt");
                    var btn = WshShell.Popup(msg, 0, "Autometa Update", 4 + 64);
                    if (btn === 6) {
                        WshShell.Run("https://github.com/Zhiro90/foobar2000-autometa/releases/latest");
                    }
                } else {
                    WshShell.Popup(getText("update_uptodate") + SCRIPT_VERSION + ")", 0, "Autometa", 64);
                }
            }
        } else {
            throw new Error("HTTP " + xmlhttp.Status);
        }
    } catch (e) {
        var WshShell = new ActiveXObject("WScript.Shell");
        WshShell.Popup(getText("update_error"), 0, "Autometa Error", 16);
    }
}

// --- TOOLTIP LOGIC ---
function update_tooltip_text() {
    ttip.Text = "";
    if (hover_zone === 2) {
        ttip.Text = getText("ttip_focus");
        return;
    }
    
    if (hover_zone === 1) {
        var alt_pressed = utils.IsKeyPressed(0x12);
        var is_auto = alt_pressed ? !auto_play : auto_play;
        var act_str = is_auto ? getText("act_autoplay") : getText("act_group");

        var handle = fb.GetNowPlaying();
        var val = "";
        if (handle) {
            if (qa_type === "meta") {
                var idx = handle.GetFileInfo().MetaFind(qa_field);
                if (idx !== -1) {
                    val = handle.GetFileInfo().MetaValue(idx, 0);
                    if (qa_field === "DATE" && qa_pattern === "TRUNCATE") {
                        var m = val.match(/^\d{4}/);
                        if (m) val = m[0];
                    }
                }
            } else if (qa_type === "tech") {
                var idx = handle.GetFileInfo().InfoFind(qa_field);
                if (idx !== -1) val = handle.GetFileInfo().InfoValue(idx);
            } else if (qa_type === "system") {
                val = fb.TitleFormat(qa_pattern).EvalWithMetadb(handle);
            }
        }

        if (val) {
            var label = val.length > 30 ? val.substring(0, 27) + "..." : val;
            ttip.Text = act_str + ": " + qa_field + " (" + label + ")";
        } else {
            ttip.Text = getText("ttip_empty") + ": " + qa_field;
        }
    }
}

// --- PAINT ---
function on_paint(gr) {
    update_colors(); 
    var w = window.Width;
    var h = window.Height;
    var handle = fb.GetNowPlaying();

    gr.FillSolidRect(0, 0, w, h, c_info_bg);
    
    var icon_flags = 1 | 4 | 32;

    var has_tag = false;
    if (handle) {
        if (qa_type === "meta") {
            has_tag = handle.GetFileInfo().MetaFind(qa_field) !== -1;
        } else if (qa_type === "tech") {
            has_tag = handle.GetFileInfo().InfoFind(qa_field) !== -1;
        } else if (qa_type === "system") {
            var val = fb.TitleFormat(qa_pattern).EvalWithMetadb(handle);
            has_tag = (val && val !== "?" && val !== "");
        }
    }
    
    var current_action_icon = has_tag ? c_action_icon : c_action_icon_dis;
    var current_action_bg = has_tag ? c_action_bg : c_action_bg_dis;

    if (display_mode === 0) {
        // === MINIMALIST ===
        gr.FillSolidRect(0, 0, w - btn_width, h, hover_zone === 1 ? c_hover : current_action_bg);
        gr.GdiDrawText("\u26A1", font_bolt_big, current_action_icon, 0, 0, w - btn_width, h, icon_flags);
        gr.FillSolidRect(w - btn_width, 0, btn_width, h, hover_zone === 3 ? c_hover : c_menu_bg);
        gr.GdiDrawText("\u25BC", font_ui, c_menu_icon, w - btn_width, 0, btn_width, h, icon_flags);
        if (theme_mode !== 1) gr.FillSolidRect(w - btn_width, 0, 1, h, RGB(0,0,0));
    } else {
        // === INFO TRACK ===
        gr.FillSolidRect(0, 0, btn_width, h, hover_zone === 1 ? c_hover : current_action_bg);
        gr.GdiDrawText("\u26A1", font_bolt_small, current_action_icon, 0, 0, btn_width, h, icon_flags);
        var txt_x = btn_width + 5;
        var txt_w = w - (btn_width * 2) - 10;
        
        if (hover_zone === 2) gr.FillSolidRect(btn_width, 0, w - (btn_width * 2), h, 0x15ffffff); 

        if (handle) {
            gr.GdiDrawText(tf_title.EvalWithMetadb(handle), font_title, c_info_title, txt_x, 0, txt_w, h/2 + 2, 1 | 8 | 32768); 
            gr.GdiDrawText(tf_artist.EvalWithMetadb(handle), font_artist, c_info_artist, txt_x, h/2, txt_w, h/2 - 2, 1 | 4 | 32768);
        } else {
            gr.GdiDrawText(getText("stopped"), font_artist, c_info_artist, txt_x, 0, txt_w, h, 1 | 4);
        }

        gr.FillSolidRect(w - btn_width, 0, btn_width, h, hover_zone === 3 ? c_hover : c_menu_bg);
        gr.GdiDrawText("\u25BC", font_ui, c_menu_icon, w - btn_width, 0, btn_width, h, icon_flags);
        if (theme_mode !== 1) {
            gr.FillSolidRect(btn_width, 0, 1, h, RGB(0,0,0));
            gr.FillSolidRect(w - btn_width, 0, 1, h, RGB(0,0,0));
        }
    }
}

// --- MOUSE & KEYBOARD ---
function on_mouse_move(x, y) {
    var w = window.Width;
    var prev_zone = hover_zone;
    
    if (display_mode === 0) {
        if (x > w - btn_width) hover_zone = 3; else hover_zone = 1;
    } else {
        if (x < btn_width) hover_zone = 1; else if (x > w - btn_width) hover_zone = 3; else hover_zone = 2;
    }
    
    if (prev_zone !== hover_zone) {
        ttip.Deactivate();
        if (hover_zone === 1 || hover_zone === 2) {
            ttip_alt_state = utils.IsKeyPressed(0x12);
            update_tooltip_text();
            ttip.Activate();
        }
        window.Repaint();
    } else if (hover_zone === 1 || hover_zone === 2) {
        var current_alt = utils.IsKeyPressed(0x12);
        if (ttip_alt_state !== current_alt) {
            ttip_alt_state = current_alt;
            update_tooltip_text();
            ttip.Activate();
        }
    }
}

function on_mouse_leave() { 
    hover_zone = 0; 
    ttip_alt_state = false;
    ttip.Deactivate();
    window.Repaint(); 
}

function on_mouse_lbtn_up(x, y) {
    ttip.Deactivate();
    switch (hover_zone) {
        case 1: run_quick_action(x, y); break;
        case 2: jump_to_now_playing(); break;
        case 3: show_context_menu(x, y); break;
    }
}

function on_mouse_rbtn_up(x, y) { 
    ttip.Deactivate();
    show_config_menu(x, y); 
    return true; 
}

function on_mouse_mbtn_up(x, y) {
    ttip.Deactivate();
    display_mode = display_mode === 0 ? 1 : 0;
    window.SetProperty("Display Mode", display_mode);
    window.Repaint();
    return true;
}

function on_key_down(vkey) {
    if (vkey === 0x12 && (hover_zone === 1 || hover_zone === 2)) {
        ttip_alt_state = true;
        update_tooltip_text();
        ttip.Activate();
    }
}

function on_key_up(vkey) {
    if (vkey === 0x12 && (hover_zone === 1 || hover_zone === 2)) {
        ttip_alt_state = false;
        update_tooltip_text();
        ttip.Activate();
    }
}

// --- CORE ---
function jump_to_now_playing() {
    if (plman.PlayingPlaylist !== -1) {
        plman.ActivePlaylist = plman.PlayingPlaylist;
        fb.RunMainMenuCommand("View/Show now playing");
    }
}

function run_quick_action(x, y, override_opt) {
    var handle = fb.GetNowPlaying();
    if (!handle) return;
    
    var opt = override_opt ? override_opt : { 
        field: qa_field, 
        type: qa_type, 
        rawPattern: qa_pattern, 
        value: "", 
        truncateDate: (qa_pattern === "TRUNCATE") 
    };
    
    var isMulti = false;
    var values = [];
    
    if (opt.type === "meta") {
        var idx = handle.GetFileInfo().MetaFind(opt.field);
        if (idx !== -1) {
            var valCount = handle.GetFileInfo().MetaValueCount(idx);
            if (valCount > 1) {
                isMulti = true;
                for (var i = 0; i < valCount; i++) {
                    var v = handle.GetFileInfo().MetaValue(idx, i);
                    if (opt.field === "DATE" && opt.truncateDate) {
                        var m = v.match(/^\d{4}/);
                        if (m) v = m[0];
                    }
                    values.push(v);
                }
                var uniqueValues = [];
                for (var u = 0; u < values.length; u++) {
                    if (uniqueValues.indexOf(values[u]) === -1) uniqueValues.push(values[u]);
                }
                values = uniqueValues;
                if (values.length === 1) isMulti = false; 
                
                opt.value = values.join("; "); 
            } else {
                var v = handle.GetFileInfo().MetaValue(idx, 0);
                if (opt.field === "DATE" && opt.truncateDate) {
                    var m = v.match(/^\d{4}/);
                    if (m) v = m[0];
                }
                opt.value = v;
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
                opt.value = values[choice - 1]; 
                create_playlist(opt);
            } else if (choice === 99) {
                create_playlist(opt, values); 
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
        var operator = (opt.field === "DATE" && opt.truncateDate) ? " HAS " : " IS ";
        if (multiValues && multiValues.length > 1) {
            var queryParts = [];
            for(var i=0; i<multiValues.length; i++) {
                queryParts.push(opt.field + operator + "\"" + String(multiValues[i]).replace(/"/g, "'") + "\"");
            }
            query = queryParts.join(" AND ");
        } else {
            query = opt.field + operator + "\"" + cleanValue + "\"";
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

    var p_idx = -1;
    
    if (single_playlist) {
        var staticName = "\uD83D\uDD0D Autometa Search";
        p_idx = plman.FindPlaylist(staticName);
        var target_idx = plman.PlaylistCount;
        
        if (p_idx !== -1) {
            target_idx = p_idx;
            plman.RemovePlaylist(p_idx);
        }
        p_idx = plman.CreateAutoPlaylist(target_idx, staticName, query);
    } else {
        var playlistName = "\uD83D\uDD0D " + opt.field + ": " + cleanValue;
        p_idx = plman.FindPlaylist(playlistName);
        if (p_idx === -1) p_idx = plman.CreateAutoPlaylist(plman.PlaylistCount, playlistName, query);
    }
    
    plman.ActivePlaylist = p_idx;
    
    var invert_autoplay = utils.IsKeyPressed(0x12);
    var final_autoplay = invert_autoplay ? !auto_play : auto_play;
    
    if (final_autoplay) plman.ExecutePlaylistDefaultAction(p_idx, 0);
}

// --- MENUS (CONFIG) ---
function show_config_menu(x, y) {
    var cMenu = window.CreatePopupMenu();
    var subLayout = window.CreatePopupMenu();
    var subTheme = window.CreatePopupMenu();
    var subBeh = window.CreatePopupMenu();
    var subLang = window.CreatePopupMenu();

    // 1. LAYOUT 
    subLayout.AppendMenuItem(display_mode === 0 ? 8 : 0, 1, getText("mode_minimal"));
    subLayout.AppendMenuItem(display_mode === 1 ? 8 : 0, 2, getText("mode_info"));
    subLayout.AppendMenuItem(0, 0, "----------------");
    subLayout.AppendMenuItem(1, 0, getText("instr_mbtn")); 
    subLayout.AppendMenuItem(0, 0, "----------------");
    subLayout.AppendMenuItem(viewMode === 0 ? 8 : 0, 5, getText("view_group"));
    subLayout.AppendMenuItem(viewMode === 1 ? 8 : 0, 6, getText("view_flat"));
    subLayout.AppendTo(cMenu, 16, getText("cat_layout"));
    
    // 2. TEMA
    subTheme.AppendMenuItem(theme_mode === 0 ? 8 : 0, 20, getText("theme_dark"));
    subTheme.AppendMenuItem(theme_mode === 1 ? 8 : 0, 21, getText("theme_sys"));
    subTheme.AppendMenuItem(theme_mode === 2 ? 8 : 0, 22, getText("theme_cust"));
    subTheme.AppendMenuItem(0, 0, "----------------");
    subTheme.AppendMenuItem(0, 23, getText("theme_import"));
    subTheme.AppendMenuItem(0, 24, getText("theme_export"));
    subTheme.AppendTo(cMenu, 16, getText("cat_theme")); 

    // 3. COMPORTAMIENTO
    subBeh.AppendMenuItem(auto_play ? 8 : 0, 3, getText("autoplay_on"));
    subBeh.AppendMenuItem(!auto_play ? 8 : 0, 4, getText("autoplay_off"));
    subBeh.AppendMenuItem(0, 0, "----------------");
    subBeh.AppendMenuItem(1, 0, getText("instr_alt"));
    subBeh.AppendMenuItem(0, 0, "----------------");
    subBeh.AppendMenuItem(!single_playlist ? 8 : 0, 30, getText("list_new"));
    subBeh.AppendMenuItem(single_playlist ? 8 : 0, 31, getText("list_single"));
    subBeh.AppendTo(cMenu, 16, getText("cat_beh"));

    // 4. IDIOMA
    subLang.AppendMenuItem(lang === 0 ? 8 : 0, 10, getText("lang_en"));
    subLang.AppendMenuItem(lang === 1 ? 8 : 0, 11, getText("lang_es"));
    subLang.AppendTo(cMenu, 16, getText("cat_lang"));

    cMenu.AppendMenuItem(0, 0, "----------------");
    cMenu.AppendMenuItem(0, 98, getText("update_check"));
    cMenu.AppendMenuItem(0, 99, getText("properties"));

    var choice = cMenu.TrackPopupMenu(x, y);

    if (choice === 1) { display_mode = 0; window.SetProperty("Display Mode", 0); }
    else if (choice === 2) { display_mode = 1; window.SetProperty("Display Mode", 1); }
    else if (choice === 20) { theme_mode = 0; window.SetProperty("Theme Mode", 0); }
    else if (choice === 21) { theme_mode = 1; window.SetProperty("Theme Mode", 1); }
    else if (choice === 22) { theme_mode = 2; window.SetProperty("Theme Mode", 2); }
    else if (choice === 23) {
        var text = read_clipboard();
        var WshShell = new ActiveXObject("WScript.Shell");
        if (text) {
            try {
                var td = JSON.parse(text);
                if (td.action_bg) { 
                    window.SetProperty("Theme Custom: Action Bg", td.action_bg);
                    window.SetProperty("Theme Custom: Action Bg (Disabled)", td.action_bg_dis || td.action_bg);
                    window.SetProperty("Theme Custom: Action Icon", td.action_icon || "255,255,255");
                    window.SetProperty("Theme Custom: Action Icon (Disabled)", td.action_icon_dis || "130,130,130");
                    window.SetProperty("Theme Custom: Info Bg", td.info_bg || "23,23,23");
                    window.SetProperty("Theme Custom: Info Title", td.info_title || "255,255,255");
                    window.SetProperty("Theme Custom: Info Artist", td.info_artist || "255,24,98");
                    window.SetProperty("Theme Custom: Menu Btn Bg", td.menu_bg || "50,50,50");
                    window.SetProperty("Theme Custom: Menu Icon", td.menu_icon || "255,255,255");
                    window.SetProperty("Theme Custom: Highlight (Hover)", td.hover || "180,50,120");
                    
                    theme_mode = 2; 
                    window.SetProperty("Theme Mode", 2);
                } else {
                    WshShell.Popup(getText("theme_msg_imp_err"), 0, "Autometa Theme", 16);
                }
            } catch(e) {
                WshShell.Popup(getText("theme_msg_imp_err"), 0, "Autometa Theme", 16);
            }
        } else {
            WshShell.Popup(getText("theme_msg_imp_err"), 0, "Autometa Theme", 16);
        }
    }
    else if (choice === 24) {
        var td = {
            action_bg: window.GetProperty("Theme Custom: Action Bg", "50,50,50"),
            action_bg_dis: window.GetProperty("Theme Custom: Action Bg (Disabled)", "30,30,30"),
            action_icon: window.GetProperty("Theme Custom: Action Icon", "255,255,255"),
            action_icon_dis: window.GetProperty("Theme Custom: Action Icon (Disabled)", "130,130,130"),
            info_bg: window.GetProperty("Theme Custom: Info Bg", "23,23,23"),
            info_title: window.GetProperty("Theme Custom: Info Title", "255,255,255"),
            info_artist: window.GetProperty("Theme Custom: Info Artist", "255,24,98"),
            menu_bg: window.GetProperty("Theme Custom: Menu Btn Bg", "50,50,50"),
            menu_icon: window.GetProperty("Theme Custom: Menu Icon", "255,255,255"),
            hover: window.GetProperty("Theme Custom: Highlight (Hover)", "180,50,120")
        };
        write_clipboard(JSON.stringify(td));
        var WshShell = new ActiveXObject("WScript.Shell");
        WshShell.Popup(getText("theme_msg_exp"), 2, "Autometa Theme", 64);
    }
    else if (choice === 3) { auto_play = true; window.SetProperty("Auto Play", true); }
    else if (choice === 4) { auto_play = false; window.SetProperty("Auto Play", false); }
    else if (choice === 30) { single_playlist = false; window.SetProperty("Single Playlist Mode", false); }
    else if (choice === 31) { single_playlist = true; window.SetProperty("Single Playlist Mode", true); }
    else if (choice === 5) { viewMode = 0; window.SetProperty("View Mode", 0); }
    else if (choice === 6) { viewMode = 1; window.SetProperty("View Mode", 1); }
    else if (choice === 10) { lang = 0; window.SetProperty("Language", 0); }
    else if (choice === 11) { lang = 1; window.SetProperty("Language", 1); }
    else if (choice === 98) { check_for_updates(); }
    else if (choice === 99) { window.ShowConfigure(); }
    
    if (choice >= 1 && choice <= 31) window.Repaint();
}

// --- MENUS (SELECTOR) ---
function show_context_menu(x, y) {
    var handle = fb.GetNowPlaying();
    if (!handle) return;
    var fileInfo = handle.GetFileInfo();
    var mainMenu = window.CreatePopupMenu();
    var validOptions = [];
    var idx = 1;

    var act_click = auto_play ? getText("act_autoplay") : getText("act_group");
    var act_alt = auto_play ? getText("act_group") : getText("act_autoplay");
    var instr_line = "Clic: " + act_click + " | +Shift: " + getText("instr_shift") + " | +Alt: " + act_alt;

    mainMenu.AppendMenuItem(1, 0, getText("assign_header") + qa_field);
    mainMenu.AppendMenuItem(1, 0, instr_line);
    mainMenu.AppendMenuItem(0, 0, "---------------------------");

    function addItem(menuObj, name, value, type, rawPattern, truncateDate) {
        var is_default = (name === qa_field && qa_type === type);
        var label = value.length > 30 ? value.substring(0, 27) + "..." : value;
        menuObj.AppendMenuItem(is_default ? 8 : 0, idx, name + ": " + label);
        validOptions[idx] = { field: name, value: value, type: type, rawPattern: rawPattern, truncateDate: truncateDate };
        idx++;
    }

    var commonTags = ["ALBUM ARTIST", "ARTIST", "ALBUM", "GENRE", "DATE"];
    for (var c = 0; c < commonTags.length; c++) {
        var idxTag = fileInfo.MetaFind(commonTags[c]);
        if (idxTag !== -1) {
            var isDate = (commonTags[c] === "DATE");
            var mCount = fileInfo.MetaValueCount(idxTag);
            var mVal = "";
            if (mCount > 1) {
                var tempArr = [];
                for(var v=0; v<mCount; v++) {
                    var vStr = fileInfo.MetaValue(idxTag, v);
                    if (isDate) {
                        var m = vStr.match(/^\d{4}/);
                        if (m) vStr = m[0];
                    }
                    if (tempArr.indexOf(vStr) === -1) tempArr.push(vStr);
                }
                mVal = tempArr.join("; ");
            } else {
                mVal = fileInfo.MetaValue(idxTag, 0);
                if (isDate) {
                    var m = mVal.match(/^\d{4}/);
                    if (m) mVal = m[0];
                }
            }
            addItem(mainMenu, commonTags[c], mVal, "meta", "", isDate);
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
            for(var v=0; v<mCount; v++) {
                var vStr = fileInfo.MetaValue(i, v);
                if (tempArr.indexOf(vStr) === -1) tempArr.push(vStr);
            }
            mVal = tempArr.join("; ");
        } else {
            mVal = fileInfo.MetaValue(i, 0);
        }
        addItem(targetMeta, mName, mVal, "meta", "", false);
    }

    // 2. Tech Info
    if (viewMode === 1) mainMenu.AppendMenuItem(1, 0, "--- " + getText("tech_header") + " ---");
    for (var j = 0; j < fileInfo.InfoCount; j++) {
        addItem(targetTech, fileInfo.InfoName(j).toUpperCase(), fileInfo.InfoValue(j), "tech", "", false);
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
        if (val && val !== "?" && val !== "") addItem(targetStat, sysTags[k].n, val, "system", sysTags[k].p, false);
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
            qa_field = opt.field; qa_type = opt.type; 
            qa_pattern = opt.truncateDate ? "TRUNCATE" : (opt.rawPattern || "");
            window.SetProperty("QuickAction Field", qa_field);
            window.SetProperty("Quick Action Type", qa_type);
            window.SetProperty("Quick Action Pattern", qa_pattern);
            window.Repaint();
        } else {
            setTimeout(function() {
                run_quick_action(x, y, opt);
            }, 50);
        }
    }
}

function on_playback_new_track() { window.Repaint(); }
function on_playback_stop() { window.Repaint(); }