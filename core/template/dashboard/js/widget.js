
flatpickr.localize(flatpickr.l10ns.fr)
timeoutId=''
async function fetchData(cmds_id) {
    try {
        const response = await new Promise((resolve, reject) => {
            domUtils.ajax({
                type: "POST",
                url: "plugins/planification/core/ajax/planification.ajax.php",
                data: { action: "récup_infos_widget", eqLogic_id: cmds_id.eqLogic_id },
                error: (request, status, error) => reject(error),
                success: (data) => resolve(data.result)
            });
        });
        return response;
    } catch (error) {
        console.error("Erreur reçue :", error);
        return null;
    }
}

function Affichage_widget(type_eqLogic, cmds_id) {
    if (cmds_id.premier_affichage) {
        cmds_id.premier_affichage = 0;
        Commun_widget(type_eqLogic, cmds_id);
        if (type_eqLogic === "PAC") {
            SetWidget_Thermostat(cmds_id);
        } else if (type_eqLogic === "Thermostat-zwave") {
            MAJ_Thermostat_Zwave(cmds_id);
        } else if (type_eqLogic === "Volet") {
            cmds_id.ouverture_fenêtre_droite = cmds_id.ouverture_fenêtre_droite === "1" ? 1 : 0;
            cmds_id.ouverture_fenêtre_gauche = cmds_id.ouverture_fenêtre_gauche === "1" ? 1 : 0;
        }
    } else {
        fetchData(cmds_id).then((data) => {
            if (!data) return;
          
            if(data.affichage_heure == '1'){                          
                data.heure_fin = data.heure_fin.slice(-5)
            }
           
            Object.assign(cmds_id, {
                mode: data.mode_fonctionnement,
                planification_en_cours: data.planification_en_cours,
                mode_planification: data.mode_planification,
                action_en_cours: data.action_en_cours,
                action_suivante: data.action_suivante,
                heure_fin: data.heure_fin,
                calendar_selector: data.calendar_selector,
                affichage_heure:data.affichage_heure
            });

            if (type_eqLogic === "PAC") {
                if (cmds_id.type_pac == 'Air/Eau'){
                    
                }
                Object.assign(cmds_id, {
                    boost: data.boost,
                    temperature_ambiante: data.temperature_ambiante,
                    consigne_temperature: data.consigne_temperature
                });
            } else if (type_eqLogic === "Thermostat-zwave") {
                
                if(cmds_id.consigne_temperature != data.consigne_temperature){
                    jeedom.cmd.execute({ 
                        id: cmds_id.set_consigne_temperature_id, 
                        value: { slider: data.consigne_temperature } 
                    });              
                    
                }
                    
                Object.assign(cmds_id, {
                    temperature_ambiante: data.temperature_ambiante,
                    consigne_temperature: data.consigne_temperature
                });
               

            } else if (type_eqLogic === "Volet") {
                Object.assign(cmds_id, {
                    niveau_batterie_gauche: data.niveau_batterie_gauche,
                    niveau_batterie_droite: data.niveau_batterie_droite,
                    ouverture_fenêtre_droite: data.ouverture_fenêtre_droite,
                    ouverture_fenêtre_gauche: data.ouverture_fenêtre_gauche
                });
            }

            Commun_widget(type_eqLogic, cmds_id);
             if (type_eqLogic === "PAC") {
                SetWidget_Thermostat(cmds_id);
            }else if(type_eqLogic === "Thermostat-zwave"){
                MAJ_Thermostat_Zwave(cmds_id);
            }
        });
    }
}

function Commun_widget(type_eqLogic,cmds_id) {
   
    const element = document.querySelector('.eqLogic[data-eqlogic_id="' + cmds_id.eqLogic_id + '"] .tuile');
    if (!element.getAttribute('listener')) {
        document.querySelector(`.eqLogic[data-eqlogic_id="${cmds_id.eqLogic_id}"] .tuile`)
        .addEventListener('click', function(event) {
            let target = event.target.closest('.bt_afficher_timepicker,.planification_auto, .img, .img_auto_manu, .nom_eqLogic, .refresh, .boost, .Climatisation, .Chauffage, .Arrêt, .Ventilation, .confort, .eco, .hors_gel, .arret, .ouvrir, .my, .fermer, .on, .off, .auto');
            if (!target) return;
            if (target.classList.contains('bt_afficher_timepicker')) {
                flatpickr(target.closest('div div').querySelector('.in_timepicker'), {
                    enableTime: true,
                    noCalendar: false,
                    dateFormat: "d-m-Y H:i",
                    time_24hr: true,
                    minuteIncrement: 1,
                    allowInput: true,
                    clickOpens: false,
                    onOpen: function(selectedDates, dateStr,instance) {
                        if (!instance.element.value) {
                            let date = new Date();
                            date.setMinutes(date.getMinutes() + 1);
                            instance.setDate(date);
                            instance.set('minDate', date);
                        }
                    },
                    onClose: function(selectedDates, dateStr, instance) {
                        jeedom.cmd.execute({ id: cmds_id.set_heure_fin_id, value: { 'message': dateStr } });
                        instance.destroy();
                    }
                });
                target.closest("div").querySelector('.in_timepicker')._flatpickr.open();
            }
    
            const cmdMapping = {                
                'boost': () => {
                    jeedom.cmd.execute({
                        id: target.style.color === "white" ? cmds_id.boost_on_id : cmds_id.boost_off_id,
                        value: { 'mode': "Manuel" }
                    });
                }
            };
   
            const cmdIds = {
                'img': cmds_id.auto_id,
                'img_auto_manu': cmds_id.auto_id,
                'nom_eqLogic': cmds_id.auto_id,
                'refresh': cmds_id.refresh_id,
                'Climatisation': cmds_id.climatisation_id,
                'Chauffage': cmds_id.chauffage_id,
                'Arrêt': cmds_id.arret_id,
                'Ventilation': cmds_id.ventilation_id,
                'boost' : cmds_id.boost_id,
                'confort': cmds_id.confort_id,
                'eco': cmds_id.eco_id,
                'hors_gel': cmds_id.hors_gel_id,
                'arret': cmds_id.arret_id,
                'ouvrir': cmds_id.ouvrir_id,
                'my': cmds_id.my_id,
                'fermer': cmds_id.fermer_id,
                'on': cmds_id.on_id,
                'off': cmds_id.off_id,
                'auto':cmds_id.auto_id,
              	'planification_auto':cmds_id.planification_auto_id
            };
           
            if (cmdMapping[target.classList[0]]) {
                cmdMapping[target.classList[0]]();
            } else if (cmdIds[target.classList[0]]) {
                
                if (target.classList[0] == "img" || target.classList[0] == "img_auto_manu" || target.classList[0] == "nom_eqLogic"){
                    if (document.querySelector('.eqLogic[data-eqlogic_uid="' + cmds_id.eqLogic_uid + '"] .' + target.classList[0]).classList.contains("cursor")) {
                        jeedom.cmd.execute({ id: cmdIds[target.classList[0]] });
                    }
                }else{
                      if (document.querySelector('.eqLogic[data-eqlogic_uid="' + cmds_id.eqLogic_uid + '"] .' + target.classList[0]).classList.contains("cursor")) {
                        jeedom.cmd.execute({ id: cmdIds[target.classList[0]] });
                    }
                    if (document.querySelector('.eqLogic[data-eqlogic_uid="' + cmds_id.eqLogic_uid + '"] .' + target.classList[0]).classList.contains("switch-on")) {
                        jeedom.cmd.execute({ id: cmdIds[target.classList[0]] });
                    }
                   
                }
                
                
                
            }
        });


        element.setAttribute('listener', 'true');

        const cmdKeys = [
            "consigne_temperature_id", "consigne_temperature_chauffage_id", "consigne_temperature_climatisation_id",
            "set_consigne_temperature_id", "boost_id", "mode_id", "action_en_cours_id", "etat_id", "action_suivante_id",
            "heure_fin_id", "set_planification_id", "planification_en_cours_id","niveau_batterie_gauche_id", 
            "ouverture_fenêtre_gauche_id", "niveau_batterie_droite_id","ouverture_fenêtre_droite_id","temp_ext_id" ,'hygrometrie_id','pourcentage_ouverture_id','pourcentage_batterie_id'

        ];
        
        // Ajout des fonctions d'update de manière dynamique
        cmdKeys.forEach(cmdKey => {
            jeedom.cmd.addUpdateFunction(cmds_id[cmdKey], function (_options) {
                Affichage_widget(type_eqLogic, cmds_id);
            });
        });
        
        // Gestion des mises à jour avec condition spécifique
        jeedom.cmd.addUpdateFunction(cmds_id.temperature_ambiante_id, function (_options) {
            if (cmds_id.targetemperature_ambiante !== _options.value) {
                cmds_id.temperature_ambiante = _options.value;
                Affichage_widget(type_eqLogic, cmds_id);
            }
        });
        
        
    }
 

    const eqLogicElement = document.querySelector(`.eqLogic[data-eqlogic_uid="${cmds_id.eqLogic_uid}"]`);
    const widgetName = eqLogicElement.querySelector(".widget-name");
    const imgElement = eqLogicElement.querySelector(".img");
    const imgMode = eqLogicElement.querySelector(".img_mode");
    const imgAutoManu = eqLogicElement.querySelector(".img_auto_manu");
    const nomEqLogic = eqLogicElement.querySelector(".nom_eqLogic");
    const selectPlanification = eqLogicElement.querySelector(".selectPlanification");
    const btTimepicker = eqLogicElement.querySelector(".bt_afficher_timepicker");
    const planificationAuto = eqLogicElement.querySelector(".planification_auto");
    const objectName = eqLogicElement.querySelector(".object_name");
    const refreshElement = eqLogicElement.querySelector(".refresh");
    const prochaineAction = eqLogicElement.querySelector(".prochaine_action");
    const thermostat = eqLogicElement.querySelector(".Thermostat");
    const imgboost = eqLogicElement.querySelector(".boost")
    const tuile  =eqLogicElement.querySelector(".tuile")
       
    // Mise en style
    tuile.style.backgroundColor = "rgba(0,0,0,0.5)";
    eqLogicElement.style.boxShadow = "0px 0px 1px 0.5px rgba(255,255,255,1)";

    // Gestion du changement de sélection
    if (selectPlanification){
        selectPlanification.onchange = (select) => {
            jeedom.cmd.execute({
                id: cmds_id.set_planification_id,
                value: {
                    select: select.target.selectedOptions[0].innerHTML,
                    Id_planification: select.target.selectedOptions[0].id
                }
            });
        };
        selectPlanification.innerHTML = cmds_id.calendar_selector
        // Gestion de l'affichage des éléments

        if (selectPlanification.children.length > 0) {
            selectPlanification.style.display = "inline";
        } else {
            selectPlanification.style.display = "none";
        }

        if (!cmds_id.set_planification_id.trim()) {
            selectPlanification.style.display = "none";
        }
    }
   
    if(cmds_id.mode == "Manuel" ){
            
        // **Affichage du timepicker et curseur**
        if (btTimepicker) btTimepicker.style.display = "block";
        // **Ajout du titre pour PAC et Prise**
        const autoTitle = `Cliquez pour remettre ${type_eqLogic === "PAC" || type_eqLogic === "Prise" ? "la" : "le"} ${type_eqLogic} en auto.`;
        if(imgElement){
            imgElement.classList.add("cursor");
            imgElement.setAttribute("title", autoTitle);
        }
        if(imgAutoManu){
            imgAutoManu.classList.add("cursor");
            imgAutoManu.setAttribute("title", autoTitle);
        }
       
        if (nomEqLogic) nomEqLogic.classList.add("cursor");
                
        // **Gestion de la prochaine action**
       
        if (cmds_id.heure_fin == "") {
            prochaineAction.innerHTML = "";
        } else {
            prochaineAction.innerHTML = cmds_id.heure_fin.length === 5 
                ? `Auto à ${cmds_id.heure_fin}`
                : `Auto le ${cmds_id.heure_fin}`;
        }
    }else if(cmds_id.mode == "Auto"){
        // **Masquer le timepicker et supprimer les classes du curseur**
        if (btTimepicker) btTimepicker.style.display = "none";    
        if (imgElement){
            imgElement.classList.remove("cursor");
            imgElement.removeAttribute("title");
        }
         if (imgAutoManu){
            imgAutoManu.classList.remove("cursor");
            imgAutoManu.removeAttribute("title");
        }
        if (selectPlanification) selectPlanification.style.width = type_eqLogic === "PAC" ? "100%" : ["Chauffage", "Volet","Prise","Thermostat-zwave"].includes(type_eqLogic) ? "80%" :"100%"
       
        // **Mise à jour de la prochaine action**
        if (prochaineAction){
            if (cmds_id.heure_fin == "") {
                prochaineAction.innerHTML = "";
            } else {
                prochaineAction.innerHTML = cmds_id.heure_fin.length === 5 
                    ? `${cmds_id.action_suivante} à ${cmds_id.heure_fin}`
                    : `${cmds_id.action_suivante} le ${cmds_id.heure_fin}`;
            }
        }
        


        // **Activation du mode Thermostat si l'action suivante est spécifique**
        if (["Chauffage", "Chauffage ECO", "Climatisation"].includes(cmds_id.action_suivante)) {
            thermostat.setAttribute("mode", "on");
        }

    }
    if(cmds_id.mode_planification == "Manuel"){
        if (planificationAuto) planificationAuto.style.display = "inline-block";    
        if (selectPlanification) selectPlanification.style.width = type_eqLogic === "PAC" ? "80%" : ["Chauffage", "Volet","Prise","Thermostat-zwave"].includes(type_eqLogic) ? "80%" :"100%"
       
                
        // **Mise à jour de la prochaine action**
       
        if (cmds_id.heure_fin == "") {
            prochaineAction.innerHTML = "";
        } else {
            prochaineAction.innerHTML = cmds_id.heure_fin.length === 5 
                ? `${cmds_id.action_suivante} à ${cmds_id.heure_fin}`
                : `${cmds_id.action_suivante} le ${cmds_id.heure_fin}`;
        }
    }else if(cmds_id.mode_planification == "Auto"){
        if (planificationAuto) planificationAuto.style.display = "none";          
        // **Mise à jour de la prochaine action**
       
        if (cmds_id.heure_fin == "") {
            prochaineAction.innerHTML = "";
        } else {
            prochaineAction.innerHTML = cmds_id.heure_fin.length === 5 
                ? `${cmds_id.action_suivante} à ${cmds_id.heure_fin}`
                : `${cmds_id.action_suivante} le ${cmds_id.heure_fin}`;
        }
    }
    
    var show_object = false
    var show_name = false
    if (type_eqLogic == 'PAC'){
        const actions = ["Climatisation", "Chauffage", "Arrêt", "Ventilation"];
        // Appliquer le style et pointerEvents aux actions
        actions.forEach(action => {
            let element = eqLogicElement.querySelector(`.${action}`);
            if (element) {
                element.style.setProperty("color", "rgb(52, 152, 219)", "important");
                element.style.pointerEvents = "auto";
            }
        });
        
        // Mise en forme des sections
        thermostat.setAttribute("mode", "on");

        // **Mise à jour de l’image**
        const imageType = {"": "Arrêt.png","arrêt": "Arrêt.png", "chauffage": "Chauffage.png", "chauffage eco": "Chauffage ECO.png", "climatisation": "Climatisation.png", "ventilation": "Ventilation.png" };    
        imgElement.setAttribute("src", `plugins/planification/core/template/dashboard/images/PAC/${imageType[cmds_id.action_en_cours.toLowerCase()]}`);
        const modeAutoActions = {}
        const modeManuelActions = {}
        // Gestion des modes Auto et Manuel
        if (cmds_id.type_pac == "Air/Air"){
              Object.assign(modeAutoActions, {
                "Arrêt": { boost: "none", autoManuRight: "10px", thermostat: "off" },
                "Ventilation": { boost: "none", autoManuRight: "10px", thermostat: "off" },
                "Climatisation": { boost: "inline-block", autoManuRight: "35px", thermostat: "on" },
                "Chauffage": { boost: "inline-block", autoManuRight: "35px", thermostat: "on" },
                "Chauffage ECO": { boost: "none", autoManuRight: "10px", thermostat: "on" }
            });
        
              Object.assign(modeManuelActions , {
                "Arrêt": { element: "Arrêt", pointerEvents: "none", color: "white", selectPlanification: "none", boost: "none", autoManuRight: "10px", thermostat: "off" },
                "Ventilation": { element: "Ventilation", pointerEvents: "none", color: "white", selectPlanification: "none", boost: "none", autoManuRight: "10px", thermostat: "off" },
                "Chauffage": { element: "Chauffage", pointerEvents: "none", color: "white", boost: "inline-block", autoManuRight: "35px", selectPlanification: "none", thermostat: "on" },
                "Chauffage ECO": { element: "Chauffage", pointerEvents: "none", color: "white", boost: "none", autoManuRight: "10px", selectPlanification: "none", thermostat: "on" },
                "Climatisation": { element: "Climatisation", pointerEvents: "none", color: "white", boost: "inline-block", autoManuRight: "35px", selectPlanification: "none", thermostat: "on" }
            });
        }else if (cmds_id.type_pac == "Air/Eau"){
              Object.assign(modeAutoActions,  {
                "Arrêt": { boost: "none", autoManuRight: "10px", thermostat: "off" },
                "Chauffage": { boost: "inline-block", autoManuRight: "35px", thermostat: "on" },
            });
        
             Object.assign(modeManuelActions, {
                "Arrêt": { element: "Arrêt", pointerEvents: "none", color: "white", selectPlanification: "none", boost: "none", autoManuRight: "10px", thermostat: "off" },
                "Chauffage": { element: "Chauffage", pointerEvents: "none", color: "white", boost: "inline-block", autoManuRight: "35px", selectPlanification: "none", thermostat: "on" },
            });
        }
       
        
        // Appliquer le mode correspondant
        const modeActions = cmds_id.mode === "Auto" ? modeAutoActions : modeManuelActions;
        const actionConfig = modeActions[cmds_id.action_en_cours] || {};
        
        if (actionConfig.element) {
            let element = eqLogicElement.querySelector(`.${actionConfig.element}`);
            if (element) {
                element.style.pointerEvents = actionConfig.pointerEvents || "auto";
                element.style.setProperty("color", actionConfig.color || "rgb(52, 152, 219)", "important");
            }
        }
        
        imgboost.style.display = actionConfig.boost || "none";
        imgAutoManu.style.right = actionConfig.autoManuRight || "10px";
        thermostat.setAttribute("mode", actionConfig.thermostat || "on");
     
        
        // Gestion du mode Boost pour une PAC Air/Air
              
        if (cmds_id.boost == 1) {
            const boostConfig = cmds_id.action_en_cours === "Chauffage" ? { color: "red", title: "Désactiver le mode boost" }
                : cmds_id.action_en_cours === "Climatisation" ? { color: "rgb(52, 152, 219)", title: "Désactiver le mode boost" }
                : null;
        
            if (boostConfig) {                    
                imgboost.style.display = "inline-block";
                imgboost.style.setProperty("color", boostConfig.color, "important");
                imgboost.setAttribute("title", boostConfig.title);
            }
        } else {            
            imgboost.style.setProperty("color", "white", "important");
            imgboost.setAttribute("title", "Activer le mode boost");
        }
        
        //masquage des icones si les commande n'exitent pas (PAC Air/Eau)
        if(!isFinite(cmds_id.boost_id)){
             imgboost.style.display = "none";
        }
        if(!isFinite(cmds_id.arret_id)){
            eqLogicElement.querySelector(".Arrêt").style.display = "none";
        }
        if(!isFinite(cmds_id.ventilation_id)){
            eqLogicElement.querySelector(".Ventilation").style.display = "none";
        }
        if(!isFinite(cmds_id.chauffage_id)){
            eqLogicElement.querySelector(".Chauffage").style.display = "none";
        }
         if(!isFinite(cmds_id.climatisation_id)){
            eqLogicElement.querySelector(".Climatisation").style.display = "none";
        }
    }
       
    if(type_eqLogic == 'Thermostat-zwave'){
        const heatingModes = ["confort", "eco", "arret"];
        // Gère les événements et couleurs dynamiquement
        const modeConfig = {
            "Auto": {
                pointerEvents: "auto",
                background: "transparent"
            },
            "Manuel": {
                "Confort": { pointerEvents: ["confort"], background: "confort" },
                "Eco": { pointerEvents: ["eco"], background: "eco" },
                "Arrêt": { pointerEvents: ["arret"], background: "arret" }
            }
        };
        if (cmds_id.mode === "Auto") {
          
        } else if (cmds_id.mode == "Manuel" ) {
            const actionConfig = modeConfig["Manuel"][cmds_id.action_en_cours] || {};
            heatingModes.forEach(mode => {
                let element = eqLogicElement.querySelector(`.${mode}`);
                if (element) {
                    element.style.pointerEvents = actionConfig.pointerEvents?.includes(mode) ? "none" : "auto";
                }
            });
        }       

        const mapping = {
            eco_id: ".eco",
            arret_id: ".arret",
            confort_id: ".confort",
            hygrometrie_id: ".hygrometrie-div",
            temp_ext_id: ".temp-externe",
            pourcentage_ouverture_id: ".poucentage-ouverture-div",
            pourcentage_batterie_id: ".poucentage-batterie-div"
        };

        Object.entries(mapping).forEach(([key, selector]) => {
            if (!isFinite(cmds_id[key])) {
                const el = eqLogicElement.querySelector(selector);
                if (el) el.style.display = "none";
            }
        });
       
        const TemperatureAmbiante = eqLogicElement.querySelector(".temperature span:first-child");
        const TemperatureAmbianteDecimale = eqLogicElement.querySelector(".temperature .degre");
        const temperatureConsigne = eqLogicElement.querySelector(".consigne span:first-child");

        // Extraction des valeurs arrondies à 1 décimale
        const [entierAmbiante, decAmbiante] = parseFloat(cmds_id.temperature_ambiante).toFixed(1).split('.');
        const [entierConsigne, decimaleConsigne] = parseFloat(cmds_id.consigne_temperature).toFixed(1).split('.');
       
        // Mise à jour du DOM (avec vérification)
        if (TemperatureAmbiante) TemperatureAmbiante.textContent = entierAmbiante;
        if (TemperatureAmbianteDecimale) TemperatureAmbianteDecimale.textContent = decAmbiante;
        if (temperatureConsigne){
            eqLogicElement.querySelector(".consigne").setAttribute("consigne",entierConsigne)
            temperatureConsigne.textContent = entierConsigne;
        } 
        if(isFinite(cmds_id.pourcentage_batterie_id)){
                MAJ_Batterie(cmds_id.eqLogic_id,cmds_id.pourcentage_batterie,eqLogicElement.querySelector(".poucentage-batterie-div .batterie-container"))
                
            jeedom.cmd.addUpdateFunction(cmds_id.pourcentage_batterie_id, function (_options) {
                if (cmds_id.pourcentage_batterie !== _options.value) {
                    cmds_id.pourcentage_batterie = _options.value;
                    MAJ_Batterie(cmds_id.eqLogic_id,cmds_id.pourcentage_batterie,eqLogicElement.querySelector(".poucentage-batterie-div .batterie-container"))
                }
            });
        }
        
        if(isFinite(cmds_id.pourcentage_ouverture_id)){
            jeedom.cmd.addUpdateFunction(cmds_id.pourcentage_ouverture_id, function (_options) {
                if (cmds_id.pourcentage_ouverture !== _options.value) {
                    cmds_id.pourcentage_ouverture = _options.value;
                    eqLogicElement.querySelector(".poucentage-ouverture-div")
                    eqLogicElement.querySelectorAll(".poucentage-ouverture-div svg path")[1].setAttribute("stroke-dasharray", cmds_id.pourcentage_ouverture + ",100")
                    eqLogicElement.querySelector(".poucentage-ouverture-div svg text").textContent = cmds_id.pourcentage_ouverture + "%"
                }
            });
        }

       
       
    }
    if (type_eqLogic == 'Chauffage'){
        const heatingModes = ["confort", "eco", "hors_gel", "arret"];
        // Gère les événements et couleurs dynamiquement
        const modeConfig = {
            "Auto": {
                pointerEvents: "auto",
                background: "transparent"
            },
            "Manuel": {
                "Confort": { pointerEvents: ["confort"], background: "confort" },
                "Eco": { pointerEvents: ["eco"], background: "eco" },
                "Hors Gel": { pointerEvents: ["hors_gel"], background: "hors_gel" },
                "Arrêt": { pointerEvents: ["arret"], background: "arret" }
            }
        };
        
        // Appliquer les styles selon le mode
        if (cmds_id.mode === "Auto") {
            heatingModes.forEach(mode => {
                let element = eqLogicElement.querySelector(`.${mode}`);
                if (element) {
                    element.style.pointerEvents = modeConfig["Auto"].pointerEvents;
                   
                }
            });
        } else if (cmds_id.mode == "Manuel" ) {
            const actionConfig = modeConfig["Manuel"][cmds_id.action_en_cours] || {};
            heatingModes.forEach(mode => {
                let element = eqLogicElement.querySelector(`.${mode}`);
                if (element) {
                    element.style.pointerEvents = actionConfig.pointerEvents?.includes(mode) ? "none" : "auto";
                }
            });
        }       
       
      
        // **Mise à jour des images**
        const imageType = {"": "arrêt.png","arrêt": "arrêt.png", "confort": "confort.png", "eco": "eco.png", "hors gel": "hors gel.png" }; 
        imgElement.setAttribute("src", `plugins/planification/core/template/dashboard/images/Chauffage/chauffage.png`); 
        imgMode.setAttribute("src", `plugins/planification/core/template/dashboard/images/Commun/${imageType[cmds_id.action_en_cours.toLowerCase()]}`);
       
    }
    if(type_eqLogic == 'Volet'){
             
        const myElement = eqLogicElement.querySelector(".my");
        const ouvrirElement = eqLogicElement.querySelector(".ouvrir");
        const fermerElement = eqLogicElement.querySelector(".fermer");
    
        // **Gestion du niveau de batterie**
        if (cmds_id.niveau_batterie_gauche !== undefined) {
        }else {
        }
    
        if (cmds_id.niveau_batterie_droite !== undefined) {
        } else {
        }
    
        // **Gestion des images**
        let etat_fenêtre = (cmds_id.ouverture_fenêtre_gauche === 1 || cmds_id.ouverture_fenêtre_droite === 1) ? "ouverte" : "fermée";
        const baseImage = cmds_id.type_fenêtre;
        const imageConfig = {
            "": { "ouverture": "-100.png", "fermeture": "-0.png", "my": "-50.png" },
            "fenêtre": { "ouverture": `-100-${etat_fenêtre}.png`, "fermeture": `-0-${etat_fenêtre}.png`, "my": `-50-${etat_fenêtre}.png` },
            "baie": { "ouverture": `-100.png`, "fermeture": `-0.png`, "my": `-50.png` },
            "default": { "ouverture": `-100-${cmds_id.sens_ouverture_fenêtre}.png`, "fermeture": `-0-${cmds_id.sens_ouverture_fenêtre}.png`, "my": `-50-${cmds_id.sens_ouverture_fenêtre}.png` }
        };    
        const imageType = imageConfig[cmds_id.type_fenêtre] || imageConfig["default"];
        const image = baseImage + (imageType[cmds_id.action_en_cours.toLowerCase()] || imageType["ouverture"]);
      
        imgElement.setAttribute("src", `plugins/planification/core/template/dashboard/images/Volet/${image}`);
    
        // **Gestion de l’affichage des boutons**
        Object.assign(myElement.style, { display: cmds_id.show_my !== "#show_my#" ? "inline-block" : "none" });
        Object.assign(ouvrirElement.style, { left: cmds_id.show_my !== "#show_my#" ? "5px" : "3px" });
        Object.assign(fermerElement.style, { right: cmds_id.show_my !== "#show_my#" ? "5px" : "3px" });
  
    
    }
    if (type_eqLogic == 'Prise'){

        const onElement = eqLogicElement.querySelector(".on");
        const offElement = eqLogicElement.querySelector(".off");
        
        // **Gestion de l'affichage selon l'état**
        const displayConfig = {
            "On": { on: "none", off: "inline-block" },
            "Off": { on: "inline-block", off: "none" }
        };
        
        if (displayConfig[cmds_id.action_en_cours]) {
            Object.assign(onElement.style, { display: displayConfig[cmds_id.action_en_cours].on });
            Object.assign(offElement.style, { display: displayConfig[cmds_id.action_en_cours].off });
        }
        // **Mise à jour de l'image**
        const imageType = {"": "off.png", "on": "on.png", "off": "off.png"};      
        imgElement.setAttribute("src", `plugins/planification/core/template/dashboard/images/Prise/${imageType[cmds_id.action_en_cours.toLowerCase()]}`);
  
   }
   if (selectPlanification){
    selectPlanification.closest("div").style.display = btTimepicker?.offsetParent ? "inline-flex" : "block";
   }
    //  redimensionnement tuile

    if (eqLogicElement.classList.contains("displayObjectName") && !eqLogicElement.classList.contains("hideEqLogicName")) {
        if (widgetName) widgetName.style.display = "none";
        if (nomEqLogic) nomEqLogic.style.display = "block";
    }

    if (eqLogicElement.classList.contains("displayObjectName") && !show_object) {
        show_object = true;
        const objectHeight = objectName.offsetHeight;
        const minHeight = Number(eqLogicElement.style.minHeight.replace(/px/i, ""));
        Object.assign(eqLogicElement.style, {
            height: `${minHeight + objectHeight}px!important`,
            minHeight: `${minHeight + objectHeight}px!important`,
            maxHeight: `${minHeight + objectHeight}px!important`
        });

        if(refreshElement)refreshElement.style.top = "0px";

        if (type_eqLogic === "PAC") {
            imgAutoManu.style.top = `${imgElement.offsetTop + imgElement.offsetHeight - 35}px`;
            imgAutoManu.style.top = "45px";
        } else if (["Chauffage", "Volet", "Prise"].includes(type_eqLogic)) {
            imgAutoManu.style.top = "45px";
        }
    } else {
        eqLogicElement.style.height = eqLogicElement.style.minHeight;
    }
       
    if (!eqLogicElement.classList.contains("hideEqLogicName") && !show_name) {
        show_name = true;
        if (widgetName) {
           widgetName.style.backgroundColor= "rgba(0,0,0,0.6)"
            const minHeight = Number(eqLogicElement.style.minHeight.replace(/px/i, ""));
            const newHeight = minHeight + widgetName.offsetHeight;
            if (imgAutoManu){ 
                imgAutoManu.style.top = "45px";
            }
           
            Object.assign(eqLogicElement.style, {
                height: `${newHeight}px!important`,
                minHeight: `${newHeight}px!important`,
                maxHeight: `${newHeight}px!important`
            });
        } else {
            eqLogicElement.style.height = eqLogicElement.style.minHeight;
        }
        if (imgAutoManu){ 
            imgAutoManu.style.top = type_eqLogic === "PAC" ? "45px" : ["Chauffage", "Volet","Prise"].includes(type_eqLogic) ? "45px" : imgAutoManu.style.top;
        }
           if(refreshElement) refreshElement.style.top = "0px";
    } else {
        eqLogicElement.style.height = eqLogicElement.style.minHeight;
    }
    if(show_name || show_object){
        if(widgetName){       
            const newHeight = eqLogicElement.offsetHeight - widgetName.offsetHeight;
            tuile.style.setProperty("height", `${newHeight}px`, "important");

        } 
        if(objectName){
            const newHeight = eqLogicElement.offsetHeight - objectName.offsetHeight;
            tuile.style.setProperty("height", `${newHeight}px`, "important");
        } 
    }
    
    
    // **Gestion de la planification**
    cmds_id.planification_en_cours ||= "Aucune planification";
    if (!cmds_id.action_en_cours && cmds_id.planification_en_cours !== "Aucune planification") {
        cmds_id.action_en_cours = `Aucune action trouvée dans la planification ${cmds_id.planification_en_cours}.`;
    }
    
    // **Mise à jour de l’image**
    const imageType = { "auto": "auto.png", "manuel": "manuel.png"}; 
    const mode = cmds_id.mode?.toLowerCase();
    //const modePlanification = (cmds_id.mode_planification?.toLowerCase() === "#mode_planification#")  ? "auto"  : cmds_id.mode_planification?.toLowerCase() ?? "auto";
    //const image = (imageType[mode] === imageType[modePlanification]) ? imageType[mode] : imageType["manuel"];
    const image = imageType[mode] ?? imageType["manuel"];
    if(imgAutoManu){
        imgAutoManu.setAttribute("src", `plugins/planification/core/template/dashboard/images/Commun/${image}`);
    }
    

}

function SetWidget_Thermostat(cmds_id) {
    const eqLogicElement = document.querySelector(`.eqLogic[data-eqlogic_uid="${cmds_id.eqLogic_uid}"]`);
    const thermostatElement = eqLogicElement.querySelector(".Thermostat");
    if(!thermostatElement) return;
    if (cmds_id.type_pac == "Air/Eau"){
        eqLogicElement.querySelector('.droite').style.display="none"
        eqLogicElement.querySelector('.gauche').classList.add('center')
        eqLogicElement.querySelector('.gauche').classList.remove("col-xs-6")
        eqLogicElement.querySelector('.img').style.float='none'
        eqLogicElement.querySelector('.img_auto_manu').style.position='relative'
        eqLogicElement.querySelector('.img_auto_manu').style.top='15px'
        eqLogicElement.querySelector('.img_auto_manu').style.right='30px'
        eqLogicElement.style.minWidth="200px"
        eqLogicElement.style.maxWidth="200px"
        return
    }
    // **Création du HTML du widget**
    thermostatElement.innerHTML = `
        <div class="cercle_ext">
            <div class="cercle_int">
                <div class="barres" min="${cmds_id.consigne_min}" max="${cmds_id.consigne_max}">
                    <div class="Nom_Temperature_consigne">Consigne</div>
                    <div class="Temperature_consigne" consigne="${cmds_id.consigne_temperature}"></div>
                    <div class="Nom_temperature_ambiante">Température</div>
                    <div class="Temperature_ambiante" temp="${cmds_id.temperature_ambiante}"></div>
                    <div class="monter_temperature cursor"></div>
                    <div class="descendre_temperature cursor"></div>
                </div>
            </div>
        </div>
    `;

    // **Ajout des barres de couleur**
    const barresElement = thermostatElement.querySelector(".barres");
    const rad2deg = 180 / Math.PI;

    for (let i = -20; i < 81; i++) {
        let deg = i * 3;
        let mytop = (-Math.sin(deg / rad2deg) * 95 + 100);
        let myleft = Math.cos((180 - deg) / rad2deg) * 95 + 100;

        barresElement.append(domUtils.parseHTML(`
            <div class="colorBar" style="transform: rotate(${deg}deg) scale(1.25, 0.5); top: ${mytop}px; left: ${myleft}px"></div>
        `));
    }

    Maj_Thermostat(cmds_id, false);

    // **Gestion de l’ajustement de la consigne de température**
    function ajusterTemperature(increment) {
        const temperatureElement = thermostatElement.querySelector(".Temperature_consigne");
        let temperatureConsigne = parseInt(temperatureElement.getAttribute("consigne")) || 7;
        const temperatureMax = parseInt(barresElement.getAttribute("max"));
        const temperatureMin = parseInt(barresElement.getAttribute("min"));

        temperatureConsigne = Math.min(Math.max(temperatureConsigne + increment, temperatureMin), temperatureMax);
        temperatureElement.setAttribute("consigne", temperatureConsigne);

        Maj_Thermostat(cmds_id, true);
        clearTimeout(timeoutId);

        timeoutId = setTimeout(() => {
            Maj_Thermostat(cmds_id, false);
            jeedom.cmd.execute({ id: cmds_id.set_consigne_temperature_id, value: { slider: temperatureConsigne } });
        }, 2000);
    }

    thermostatElement.querySelector(".monter_temperature").onclick = () => ajusterTemperature(1);
    thermostatElement.querySelector(".descendre_temperature").onclick = () => ajusterTemperature(-1);
}

function Maj_Thermostat(cmds_id, click) {
    const Thermostat = document.querySelector(`.eqLogic[data-eqlogic_id="${cmds_id.eqLogic_id}"] .Thermostat`);
    const temperatureConsigneElement = Thermostat.querySelector(".Temperature_consigne");
    const temperatureAmbianteElement = Thermostat.querySelector(".Temperature_ambiante");
    const nomTemperatureAmbianteElement = Thermostat.querySelector(".Nom_temperature_ambiante");
    const colorBars = Thermostat.querySelectorAll(".colorBar");
    const centerCircle = Thermostat.querySelector(".cercle_int");
    
    const couleurs = ['243594', '2c358f', '373487', '44337e', '513174', '5c306c', '6b2f62', '792e58', '892d4d', '9e2b3d', 'b4292e', 'c9271f', 'e0250e'];
    let temperatureConsigne = Math.round(temperatureConsigneElement.getAttribute("consigne")) || 7;
    
    const temperatureMax = parseInt(Thermostat.querySelector(".barres").getAttribute("max"));
    const temperatureMin = parseInt(Thermostat.querySelector(".barres").getAttribute("min"));

    // **Correction si valeur hors limites**
    temperatureConsigne = Math.min(Math.max(temperatureConsigne, temperatureMin), temperatureMax);

    // **Mise à jour de l'affichage**
    temperatureConsigneElement.innerHTML = `${temperatureConsigne}°C`;
    if (cmds_id.temperature_ambiante) {
        nomTemperatureAmbianteElement.innerHTML = "Température";
        temperatureAmbianteElement.innerHTML = `${cmds_id.temperature_ambiante}°C`;
    } else {
        nomTemperatureAmbianteElement.innerHTML = "";
        temperatureAmbianteElement.innerHTML = "";
    }

    // **Gestion du ratio pour colorBar**
    const ratio = temperatureMax / (temperatureMax - temperatureMin) - 1;
    const nb = ((Math.round(temperatureConsigne) / (temperatureMax - temperatureMin)) - ratio) * 100;

    // **Activation des barres de couleur**
    if (click) {
        colorBars.forEach((_el, i) => _el.classList.toggle("active", i < nb));
    } else {
        colorBars.forEach(_el => _el.classList.remove("active"));
    }

    // **Définition de la couleur de fond**
    const couleurFond = temperatureConsigne < 16 ? `#${couleurs[0]}` :
                        temperatureConsigne > 28 ? `#${couleurs[11]}` :
                        `#${couleurs[temperatureConsigne - 16]}`;

    centerCircle.style.background = couleurFond;
}

function MAJ_Thermostat_Zwave(cmds_id){
     const heatingModes = ["confort", "eco", "arret"];
        // Gère les événements et couleurs dynamiquement
    const modeConfig = {
        "Auto": {
            pointerEvents: "auto",
            background: "transparent"
        },
        "Manuel": {
            "Confort": { pointerEvents: ["confort"], background: "confort" },
            "Eco": { pointerEvents: ["eco"], background: "eco" },
            "Arrêt": { pointerEvents: ["arret"], background: "arret" }
        }
    };
    const eqLogicElement = document.querySelector(`.eqLogic[data-eqLogic_uid="${cmds_id.eqLogic_uid}"]`);
    const thermostat = eqLogicElement.querySelector(`.thermo`);
    const mode_element = eqLogicElement.querySelector(`.mode`);
    const temperatureConsigneElement = thermostat.querySelector(".consigne");
    const temperatureConsigneElementSpan = temperatureConsigneElement.querySelector(".consigne  span:first-child");
    const couleurs = ['243594', '2c358f', '373487', '44337e', '513174', '5c306c', '6b2f62', '792e58', '892d4d', '9e2b3d', 'b4292e', 'c9271f', 'e0250e'];
    var temperatureConsigne = Math.round(temperatureConsigneElement.getAttribute("consigne")) || 7;
        
    const temperatureMax = parseInt(temperatureConsigneElement.getAttribute("max"));
    const temperatureMin = parseInt(temperatureConsigneElement.getAttribute("min"));

    // **Correction si valeur hors limites**
    temperatureConsigne = Math.min(Math.max(temperatureConsigne, temperatureMin), temperatureMax);

    // **Mise à jour de l'affichage**
    const [entierConsigne, decimaleConsigne] = parseFloat(temperatureConsigne).toFixed(1).split('.');
    temperatureConsigneElementSpan.textContent  = entierConsigne
    const couleurFond = temperatureConsigne < 16 ? `#${couleurs[0]}` : temperatureConsigne > 28 ? `#${couleurs[11]}` : `#${couleurs[temperatureConsigne - 16]}`;
    
    temperatureConsigneElementSpan.style.color = couleurFond;     
    function ajusterTemp(increment,temperatureConsigneElement) {
        let temperatureConsigne = parseInt(temperatureConsigneElement.getAttribute("consigne")) || 7;
        const temperatureMax = parseInt(temperatureConsigneElement.getAttribute("max"));
        const temperatureMin = parseInt(temperatureConsigneElement.getAttribute("min"));

        temperatureConsigne = Math.min(Math.max(temperatureConsigne + increment, temperatureMin), temperatureMax);
        temperatureConsigneElement.setAttribute("consigne", temperatureConsigne);
        
        const temperatureConsigneElementSpan = temperatureConsigneElement.querySelector(".consigne  span:first-child");
        
        const [entierConsigne, decimaleConsigne] = parseFloat(temperatureConsigne).toFixed(1).split('.');
        temperatureConsigneElementSpan.textContent  = entierConsigne
        // **Définition de la couleur de fond**
        const couleurFond = temperatureConsigne < 16 ? `#${couleurs[0]}` :temperatureConsigne > 28 ? `#${couleurs[11]}` : `#${couleurs[temperatureConsigne - 16]}`;
    
        temperatureConsigneElementSpan.style.color = couleurFond;     
        
        clearTimeout(timeoutId);

        timeoutId = setTimeout(() => {
            
            jeedom.cmd.execute({ id: cmds_id.set_consigne_temperature_id, value: { slider: temperatureConsigne } });
            if (isFinite( cmds_id.set_consigne_temperature_zwave_id)) {
                jeedom.cmd.execute({ id: cmds_id.set_consigne_temperature_zwave_id, value: { slider: temperatureConsigne } });
            }
        }, 2000);
    }
    
    thermostat.querySelector(".button-plus").onclick = () => ajusterTemp(1,temperatureConsigneElement);
    thermostat.querySelector(".button-moins").onclick = () => ajusterTemp(-1,temperatureConsigneElement);
    mode_element.querySelector(".auto").onclick = () => toggleSwitchMode(mode_element.querySelector(".auto"),cmds_id);
    mode_element.querySelector(".confort").onclick = () => toggleSwitchMode(mode_element.querySelector(".confort"),cmds_id);
    mode_element.querySelector(".eco").onclick = () => toggleSwitchMode(mode_element.querySelector(".eco"),cmds_id);
    mode_element.querySelector(".arret").onclick = () => toggleSwitchMode(mode_element.querySelector(".arret"),cmds_id);

    
    if(cmds_id.mode == "Auto"){// && cmds_id.mode_planification == "Auto"){
        toggleSwitchMode(mode_element.querySelector(".auto"),cmds_id)
       
    }else if(cmds_id.mode == "Manuel"){
        const action = cmds_id.action_en_cours.toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

        toggleSwitchMode(mode_element.querySelector("." + action),cmds_id)
    }

    function toggleSwitchMode(switchElement, cmds_id) {

        const eqLogicElement = document.querySelector(`.eqLogic[data-eqLogic_uid="${cmds_id.eqLogic_uid}"]`);
        
        // Désactive tous les switches ON
        eqLogicElement.querySelectorAll('.switch-on').forEach(function (el) {
        
            el.classList.remove("switch-on");
            el.classList.add("switch-off");
            el.classList.add("cursor");
            const useEl = el.querySelector(".mode-switch use");
            if (useEl) {
                useEl.setAttribute("xlink:href",
                    "plugins/planification/core/template/dashboard/images/Thermostat-zwave/images.svg#shape-switch-off"
                );
            }

            const label = el.querySelector(".mode-label");
            if (label) {
                label.classList.remove("mode-label-on");
            }
        });

        // Active le switch cliqué
        const parentSwitch = switchElement.closest(".switch-off");
        if (parentSwitch) {
            parentSwitch.classList.remove("switch-off");
            parentSwitch.classList.add("switch-on");
            parentSwitch.classList.remove("cursor");
        }

        const useClicked = switchElement.querySelector(".mode-switch use");
        if (useClicked) {
            useClicked.setAttribute("xlink:href",
                "plugins/planification/core/template/dashboard/images/Thermostat-zwave/images.svg#shape-switch-on"
            );
        }

        // Ajoute la classe au label précédent
        const labels = parentSwitch.querySelectorAll(".mode-label");
        labels.forEach(label => label.classList.add("mode-label-on"));
    }


}

function MAJ_Batterie(eqLogic_id,percentage_value,batterieContainer){
    
        
        if( percentage_value.toString().slice(-1)=="%"){   
        percentage_value = percentage_value.toString().substring(0,percentage_value.length - 1)
        }
       
        if (batterieContainer.getAttribute("batterie_danger_threshold") == null || batterieContainer.getAttribute("batterie_warning_threshold") == null){

            domUtils.ajax({
                type: 'POST',
                url: 'core/ajax/eqLogic.ajax.php',
                data: {              
                    action: "byId",
                    id: eqLogic_id
                },
                async: false,
                global: false,
                dataType: 'json',
                error: function(request, status, error) {
                    handleAjaxError(request, status, error);
                },
                success: function(data) {
                    if (data.state == 'ok') {

                    if (data.result["configuration"]["battery_danger_threshold"] == undefined || data.result["configuration"]["battery_danger_threshold"] == ""){

                        domUtils.ajax({
                        type: 'POST',
                        url: 'core/ajax/config.ajax.php',
                        data: {              
                            action: "getKey",
                            key: 'battery::danger'
                        },
                        async: false,
                        global: false,
                        dataType: 'json',
                        error: function(request, status, error) {
                            handleAjaxError(request, status, error);
                        },
                        success: function(data) {
                            if (data.state == 'ok') {
                            batterieContainer.setAttribute("batterie_danger_threshold",data.result)
                          
                            } else {   
                            jeedomUtils.showAlert({
                                message: data.result,
                                level: 'danger'
                            })

                            }
                        }
                        });
                    }else{
                        batterieContainer.setAttribute("batterie_danger_threshold",data.result["configuration"]["battery_danger_threshold"])
                       
                    }

                    if (data.result["configuration"]["battery_warning_threshold"] == undefined || data.result["configuration"]["battery_warning_threshold"] == ""){

                        domUtils.ajax({
                        type: 'POST',
                        url: 'core/ajax/config.ajax.php',
                        data: {              
                            action: "getKey",
                            key: 'battery::warning'
                        },
                        async: false,
                        global: false,
                        dataType: 'json',
                        error: function(request, status, error) {
                            handleAjaxError(request, status, error);
                        },
                        success: function(data) {
                            if (data.state == 'ok') {
                                batterieContainer.setAttribute("batterie_warning_threshold",data.result)
                                //batterie_warning_threshold=data.result;
                            }else{     
                                jeedomUtils.showAlert({
                                    message: data.result,
                                    level: 'danger'
                                })
                            }
                        }
                        })
                    }else{
                        batterieContainer.setAttribute("batterie_warning_threshold",data.result["configuration"]["batterie_warning_threshold"])
                        //batterie_warning_threshold = data.result["configuration"]["batterie_warning_threshold"];
                    }
                    } else {      
                    jeedomUtils.showAlert({
                        message: data.result,
                        level: 'danger'
                    })
                    }
                }
            });
        }
        if (Number(percentage_value) <= Number(batterieContainer.getAttribute("batterie_danger_threshold"))){
            batterieContainer.querySelector('.batterie-remplissage').classList.remove('batterie-remplissage-ok');
            batterieContainer.querySelector('.batterie-remplissage').classList.remove('batterie-remplissage-warning');
            batterieContainer.querySelector('.batterie-remplissage').classList.add('batterie-remplissage-alert');
            batterieContainer.querySelector('.batterie').classList.remove('batterie-ok');
            batterieContainer.querySelector('.batterie').classList.remove('batterie-warning');
            batterieContainer.querySelector('.batterie').classList.add('batterie-alert');
            batterieContainer.querySelector('.batterie-level').setAttribute('color','transparent');
            batterieContainer.classList.add('alerte');
        } else if (Number(percentage_value) <= Number(batterieContainer.getAttribute("batterie_warning_threshold"))){
            batterieContainer.classList.remove('alerte');
            batterieContainer.querySelector('.batterie-remplissage').classList.remove('batterie-remplissage-ok');
            batterieContainer.querySelector('.batterie-remplissage').classList.remove('batterie-remplissage-alert');
            batterieContainer.querySelector('.batterie-remplissage').classList.add('batterie-remplissage-warning');
            batterieContainer.querySelector('.batterie').classList.remove('batterie-ok');
            batterieContainer.querySelector('.batterie').classList.remove('batterie-alert');
            batterieContainer.querySelector('.batterie-level').setAttribute('color','black');
            batterieContainer.querySelector('.batterie').classList.add('batterie-warning');
        } else {
            batterieContainer.classList.remove('alerte');
            batterieContainer.querySelector('.batterie-remplissage').classList.remove('batterie-remplissage-warning');
            batterieContainer.querySelector('.batterie-remplissage').classList.remove('batterie-remplissage-alert');
            batterieContainer.querySelector('.batterie-remplissage').classList.add('batterie-remplissage-ok');
            batterieContainer.querySelector('.batterie').classList.remove('batterie-warning');
            batterieContainer.querySelector('.batterie').classList.remove('batterie-alert');
            batterieContainer.querySelector('.batterie').classList.add('batterie-ok');
            batterieContainer.querySelector('.batterie-level').setAttribute('color','var(--link-color)');

        }
        batterieContainer.querySelector('.batterie-remplissage').setAttribute('style', 'width:' + (percentage_value == 0 ? '5' : percentage_value) + '%;');
        batterieContainer.querySelector('.batterie-level').innerText=percentage_value + '%';



    
  
}
