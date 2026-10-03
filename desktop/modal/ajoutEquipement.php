 <form class="form-horizontal" onsubmit="return false;">
    <div>
        <div class="radio">
            <label>
                <input type="radio" name="Type_équipement" id="Volet" value="Volet" checked="checked"> {{Volet}}
            </label>
        </div>
        <div class="radio">
            <label>
                <input type="radio" name="Type_équipement" id="PAC" value="PAC"> {{Pompe à chaleur}}
            </label>
        </div>
        <div class="radio">
            <label>
                <input type="radio" name="Type_équipement" id="Thermostat-chauffage-zwave" value="Thermostat-chauffage-zwave"> {{Thermostat connecté Zwave pour chauffage}}
            </label>
        </div>
        <div class="radio">
            <label>
                <input type="radio" name="Type_équipement" id="Thermostat-ambiance-zwave" value="Thermostat-ambiance-zwave"> {{Thermostat d'ambiance connecté Zwave}}
            </label>
        </div>
        <div class="radio">
            <label>
                <input type="radio" name="Type_équipement" id="Prise" value="Prise"> {{Prise}}
            </label>
        </div>
        <div class="radio">
            <label>
                <input type="radio" name="Type_équipement" id="Chauffage" value="Chauffage"> {{Chauffage avec fil pilote}}
            </label>
        </div>
        <div class="radio">
            <label>
                <input type="radio" name="Type_équipement" id="Perso" value="Perso"> {{Perso}}
            </label>
        </div>
        <br>
        <div class="input">
            <input class="col-sm-8" type="text" placeholder="Nom de l'équipement" name="nom" id="nom">
        </div>
        <br>
    </div>
</form>