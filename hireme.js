const hireForm = document.getElementById("hireForm");

hireForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    const submitButton = hireForm.querySelector(
        'button[type="submit"]'
    );

    const originalText = submitButton.textContent;

    submitButton.disabled = true;
    submitButton.textContent = "Sending...";

    const formData = new FormData(hireForm);

    const data = {

        fullName: formData.get("fullName"),

        email: formData.get("email"),

        phone: formData.get("phone"),

        country: formData.get("country"),

        service: formData.get("service"),

        projectDescription:
            formData.get("projectDescription")

    };


    try {

        const response = await fetch(
            "http://localhost:5001/api/hire",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(data)
            }
        );


        const result = await response.json();


        if (result.success) {

            alert(
                "✅ Your project request has been sent successfully!"
            );

            hireForm.reset();

        } else {

            alert(
                "❌ " +
                (result.message ||
                "Unable to send your request.")
            );

        }


    } catch (error) {

        console.error(error);

        alert(
            "❌ Could not connect to the SinaFast Hire API."
        );

    }


    submitButton.disabled = false;
    submitButton.textContent = originalText;

});
