function parseError() {
    const errorData = document.getElementById("errorData").value.trim();
    const customErrorsText = document.getElementById("customErrors").value;
    const resultDiv = document.getElementById("result");

    resultDiv.innerHTML = "<p>Processing...</p>";

    try {
        // Process custom errors (split by newline and filter empty lines)
        const customErrors = customErrorsText
            .split("\n")
            .map((line) => line.trim())
            .filter((line) => line.startsWith("error "));

        // Create interface with possible custom errors
        const errorInterface = new ethers.utils.Interface(customErrors);

        try {
            // Attempt to parse the error
            const parsedError = errorInterface.parseError(errorData);

            let resultHTML = `
                <h3>Successfully parsed error:</h3>
                <p><strong>Name:</strong> ${parsedError.name}</p>
                <p><strong>Signature:</strong> ${parsedError.signature}</p>
                <p><strong>Arguments:</strong> ${JSON.stringify(
                    parsedError.args,
                    null,
                    2
                )}</p>
            `;

            resultDiv.innerHTML = resultHTML;
        } catch (e) {
            // Check if it's a standard error
            const STANDARD_ERRORS = {
                "0x08c379a0": "Error(string)", // revert("message")
                "0x4e487b71": "Panic(uint256)", // assert failure
            };

            const sig = errorData.slice(0, 10); // First 4 bytes
            if (STANDARD_ERRORS[sig]) {
                const stdInterface = new ethers.utils.Interface([
                    `error ${STANDARD_ERRORS[sig]}`,
                ]);
                const parsed = stdInterface.parseError(errorData);

                resultDiv.innerHTML = `
                    <h3>Standard Error Detected:</h3>
                    <p><strong>Type:</strong> ${parsed.name}</p>
                    <p><strong>Arguments:</strong> ${JSON.stringify(
                        parsed.args,
                        null,
                        2
                    )}</p>
                `;
                return;
            }

            // Show error possibilities
            let possibleErrors =
                "<h3>Possible Errors Matching This Signature:</h3><ul>";
            customErrors.forEach((err) => {
                const sig = ethers.utils.id(err).slice(0, 10);
                if (sig === errorData.slice(0, 10)) {
                    possibleErrors += `<li>${err} (signature: ${sig})</li>`;
                }
            });
            possibleErrors += "</ul>";

            resultDiv.innerHTML = `
                <h3>Failed to Parse Error</h3>
                <p>Unknown error signature: <code>${errorData}</code></p>
                ${
                    customErrors.length
                        ? possibleErrors
                        : "<p>No custom errors defined</p>"
                }
                <p>Try adding the correct error definition above.</p>
            `;
        }
    } catch (err) {
        resultDiv.innerHTML = `
            <h3>Error Occurred</h3>
            <p>${err.message}</p>
            <pre>${err.stack}</pre>
        `;
    }
}
