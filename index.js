var cTemplateEngine = new TemplateEngine();

$(document).ready(function() {
	cTemplateEngine.Init();

	var oTemplateContents = {
		one: [
			{
				content: "hello",
				class: ""
			},
			{
				content: "there", 
				class: "left"
			}
		],
		two: [
			{
				content: "1"
			}
		],
		container: "dogs"
	};
	
	cTemplateEngine.LoadInto("templates/section.template", "1", oTemplateContents, $('#target'));
});
