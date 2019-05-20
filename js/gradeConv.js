

$(document).ready(function(){

$("#Gobutton").click(function() {
	$("#gradesTable").html("");
	var inputs = $("#inputText").val();
	try{
		$("#error").html("");
		info = processInfo(inputs);		
		summ = getSummary(info);
		printarray(addHeader(summ,'avg'));
		$("#alldata").show()
		//printarray(addHeader(info));
		scroll_to_anchor('gradesTable');
		ga('send', 'event', 'Button', 'Go');
	}
	catch (err){
		$("#error").html('<div class="alert alert-danger fade in">'+'<strong>'+ err + '</strong>' + '</div>');
		scroll_to_anchor('error');
	}

})

$("#Clearbutton").click(function() {
	$("#inputText").val("");+
	$("#error").html("");
	$("#gradesTable").html("");
	$("#alldata").hide();
	$("#summdata").hide();
})

$("#AllDatabutton").click(function() {
	$("#gradesTable").html("");
	$("#gradesTable").css("width","80%");
	printarray(addHeader(info));
	$("#alldata").hide();
	$("#summdata").show();
	scroll_to_anchor('gradesTable');
})

$("#Summbutton").click(function() {
	$("#gradesTable").html("");
	$("#gradesTable").css("width","60%");
	printarray(addHeader(summ,'avg'));
	$("#alldata").show();
	$("#summdata").hide();
	scroll_to_anchor('gradesTable');
})

});


/**
*Output information of all years and overall averages
*
*/

function getSummary(processed_Data){

	var overallAvg = [calcAverages(processed_Data)]; // calulate overall average
	var years = getAllyears(processed_Data); //get unique list of all years in the data
	var sessionals = sessionalAvg(processed_Data,years);	//calculate sessional averages
	var averages = sessionals.concat(overallAvg); // create summary array containing averages

	return averages;
}

/**takes in raw text and return an array containing all the grades information
 4 point conversion is appended
 *@param {string} rawData
 *@return {array} rows
*/
function processInfo(rawData){
	rawData = rawData.replace(/\t\n/g, ""); // remove any empty lines with just a tab and no data
	console.log(rawData);
	var lineRegex = /\w+ \d\w+\d.?\n.*\n.*\n.*\n.*\n.*/g; // each entry contains 6 sections

	var rows = [];
	while((data = lineRegex.exec(rawData)) !== null){
		var entry = data[0].split('\n');
		rows.push(entry);
	}
	addConversions(rows); // append grade conversions to Data
	getAllyears(rows, true); //append years to the rows data
	addIncludeBool(rows); //add Boolean to show if the value was included in the average
	
	if (rows.length == 0){
		throw "Uh Oh! There are no grades here. Please review the steps and try again."
	}

	return rows;
}
	
/** returns the grade conversion f the letter
* letter - string
* conv - string '12_Pt'or '4_Pt'
*/
function letterConv(letter, conv){
	
	gradeDict = {
	'A+':{'12_Pt':12,'4_Pt':4},
	'A':{'12_Pt':11,'4_Pt':3.9},
	'A-':{'12_Pt':10,'4_Pt':3.7},
	'B+':{'12_Pt':9,'4_Pt':3.3},
	'B':{'12_Pt':8,'4_Pt':3},
	'B-':{'12_Pt':7,'4_Pt':2.7},
	'C+':{'12_Pt':6,'4_Pt':2.3},
	'C':{'12_Pt':5,'4_Pt':2},
	'C-':{'12_Pt':4,'4_Pt':1.7},
	'D+':{'12_Pt':3,'4_Pt':1.3},
	'D':{'12_Pt':2,'4_Pt':1},
	'D-':{'12_Pt':1,'4_Pt':0.7},
	'F':{'12_Pt':0,'4_Pt':0}
	}

	try{
		conversion = gradeDict[letter][conv];
	}
	catch (err){
		conversion = letter;
	}

	return conversion;
}


function addConversions(gradesData){

	for(var i =0; i<(gradesData.length); i++){
		try{
			grade_Letter = gradesData[i][3];
			gradesData[i].push(letterConv(grade_Letter,'12_Pt'));
			gradesData[i].push(letterConv(grade_Letter,'4_Pt'));
		}
		catch (err){
			gradesData[i].push(0);
			gradesData[i].push(0);
		}
	}
		
}

function addIncludeBool(gradesData){

	for(var i =0; i<(gradesData.length); i++){
		try{
			var grade = gradesData[i][3];
			var units = gradesData[i][4];
			var status = gradesData[i][5];
			//boolean criteria to include in calculation
			gradesData[i].push(IncludeBool(gradesData[i]));
			}
		catch (err){
			continue;
		}
	}
}
//Calculates the include bool value, true and false, for whether this grade should be included
function IncludeBool(gradeRow){
	var grade = gradeRow[3];
	var units = gradeRow[4];
	var status = gradeRow[5].trim(); // remove extra spaces
	var include = (units >0 && status == "Taken" && typeof letterConv(grade,'12_Pt') === 'number')

	return include
}
// returns a unique list of all academic years in the data
function getAllyears(gradesData, add_to_data = false){
	var years = new Set();

	for(var i =0; i<(gradesData.length); i++){
		try{
			var row = gradesData[i];
			var term = row[2];
			schoolYear = academicYear(term);
			if (add_to_data){
				row.push(schoolYear);
			}

			if (schoolYear > 0){
			years.add(schoolYear);
			}
		}
		catch (err){
			continue;
		}
	}

	return (Array.from(years)).sort();
}

//returns the academic year given the Term string column 3
function academicYear(term){
	var len = term.length;
	try{
	var yearShift = (((term.substring(9,10) !== '/') 
		&& (term.substring(len-6,len) == "Winter")) 
		|| (term.substring(len-6,len) == 'Summer'));
	var academicYear = parseInt(term.substring(0,4)) - (yearShift ? 1:0);
	}
	catch (err){
		academicYear = 0;
	}

	return academicYear;
}
//rounds the values to the specified number of integers
function round(value, decimals = 2) {
	try{
  		return Number(Math.round(value+'e'+decimals)+'e-'+decimals);
  	}
  	catch(err){
  		return "N/A"
  	}

}

function addHeader(info, header_type = 'all'){

	var allHeader = [['Course', 'Description', 'Term', 'Grade', 'Units', 'Status', '12 point', '4 point', 'Academic Year','Included In Overall Average']];
	var avgHeader = [['Year', '12 Point', '4 Point', 'Units in Average', 'Total Units']];
	var header = allHeader
	if (header_type == "avg"){
		var header = avgHeader;
	}
	return header.concat(info);

}
/**
* returns the total cummulative average (all years)
*/

function calcAverages(gradesData){
	var tot12p = 0;    
	var tot4p = 0;
	var totUnits = 0;
	var allUnits = 0;		
	for (var i = 0; i < gradesData.length; i++){
		var row = gradesData[i];
		var units = row[4]*1.0;
		var allUnits = allUnits + units

		if (row[row.length -1]){
			letterGrade = row[3];
			tot12p = tot12p + letterConv(letterGrade,'12_Pt')*units;
			tot4p = tot4p + letterConv(letterGrade,'4_Pt')*units;
			totUnits = totUnits + units;
		}
	}


	var cumm4p = round(tot4p/totUnits);
	var cumm12p = round(tot12p/totUnits);


	return ['Overall',cumm12p,cumm4p, totUnits, allUnits];
}

//returns a nested list of year 12 point average, 4 point average, units in the average, and total units for each year
function sessionalAvg(rows, years){
	for (var sessionals = []; sessionals.push([0,0,0,0,0]) <years.length;);
	//array for each year [[year,12p,14p,unitsinAvg, Total Units]]

	for(var i = 0; i< years.length; i++){
		sessionals[i][0] = years[i];
	}

	for(var i = 0; i< rows.length; i++){
		row = rows[i];
		try{
			var units = (row[4])*1.0;
			var term = row[2];
			var year = academicYear(term);
			var index = years.indexOf(year);
			
			// totUnits is updated
			sessionals[index][4] = sessionals[index][4] + units;

			if (row[row.length-1]){
				letterGrade = row[3];
				sessionals[index][1] = sessionals[index][1] + letterConv(letterGrade,'12_Pt')*units;
				sessionals[index][2] = sessionals[index][2] + letterConv(letterGrade,'4_Pt')*units;
				sessionals[index][3] = sessionals[index][3] + units;
				}
		}

		catch (err){
			continue;
		}
	}
	// 
	for(var i = 0; i< sessionals.length; i++){
		year = sessionals[i];
		units = year[3];
		if (units > 0){
			tot12p = year[1];
			tot4p = year[2];
			year[1] = round(tot12p/units);
			year[2] = round(tot4p/units);
		}
		else{
			year[1] = "No Units" ;
			year[2] = "No Units";
		}
	}

	return sessionals;
}

function addrow(row, array){
	// Find a <table> element with id="gradesTable":
	var table = document.getElementById("gradesTable");

	// Create an empty <tr> element and add it to row'th position
	var row = table.insertRow(row);

	var arrlen = array.length;

	for(var i = 0; i< arrlen; i++){
		// Insert new cells (<td> elements)
		var cell = row.insertCell(i);
		cell.innerHTML = String(array[i]);
	}

}

function printarray(array){
	var arrlen = array.length;

	for(var i = 0; i< arrlen; i++){
		addrow(i,array[i]);
	}
}
function scroll_to_anchor(anchor_id){
    var tag = $("#"+anchor_id+"");
    $('html,body').animate({scrollTop: tag.offset().top},'slow');
}


