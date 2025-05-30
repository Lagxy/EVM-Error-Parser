function parseError() {
    const errorData = document.getElementById("errorData").value.trim();
    const customErrorsText = document.getElementById("customErrors").value;
    const resultDiv = document.getElementById("result");

    // Clear previous results
    resultDiv.innerHTML = "<p>Processing...</p>";

    // Validate error data input
    if (!errorData.startsWith("0x") || errorData.length < 10) {
        resultDiv.innerHTML =
            '<p class="error-match">Error: Please enter a valid error signature starting with 0x (at least 10 characters)</p>';
        return;
    }

    // Process custom errors
    const customErrors = customErrorsText
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.startsWith("error ") && line.endsWith(");"));

    if (customErrors.length === 0) {
        resultDiv.innerHTML =
            '<p class="error-match">Error: No valid custom errors found. Each line should start with "error " and end with ");"</p>';
        return;
    }

    try {
        // Create interface with the provided custom errors
        const errorInterface = new ethers.utils.Interface(customErrors);

        // Calculate all signatures for reference
        const errorSignatures = customErrors.map((err) => {
            return {
                error: err,
                signature: ethers.utils.id(err).slice(0, 10),
            };
        });

        try {
            // Attempt to parse the error
            const parsedError = errorInterface.parseError(errorData);

            resultDiv.innerHTML = `
                        <h3>Successfully parsed custom error:</h3>
                        <p><strong>Error Name:</strong> <span class="error-match">${
                            parsedError.name
                        }</span></p>
                        <p><strong>Signature:</strong> ${
                            parsedError.signature
                        }</p>
                        ${
                            parsedError.args.length
                                ? `<p><strong>Arguments:</strong> ${JSON.stringify(
                                      parsedError.args,
                                      null,
                                      2
                                  )}</p>`
                                : ""
                        }
                        <p><strong>Raw Data:</strong> ${errorData}</p>
                    `;
        } catch (e) {
            // Check if it's a standard error
            const STANDARD_ERRORS = {
                "0x08c379a0": {
                    name: "Error(string)",
                    desc: "Standard revert with message string",
                },
                "0x4e487b71": {
                    name: "Panic(uint256)",
                    desc: "Assertion failure or arithmetic overflow",
                },
            };

            const sig = errorData.slice(0, 10);

            // Check for standard errors
            if (STANDARD_ERRORS[sig]) {
                const stdInterface = new ethers.utils.Interface([
                    `error ${STANDARD_ERRORS[sig].name}`,
                ]);
                const parsed = stdInterface.parseError(errorData);

                resultDiv.innerHTML = `
                            <h3>Standard EVM Error Detected</h3>
                            <p><strong>Type:</strong> ${parsed.name}</p>
                            <p><strong>Description:</strong> ${
                                STANDARD_ERRORS[sig].desc
                            }</p>
                            ${
                                parsed.args.length
                                    ? `<p><strong>Details:</strong> ${JSON.stringify(
                                          parsed.args
                                      )}</p>`
                                    : ""
                            }
                            <p><em>Note: This is a built-in EVM error, not a custom contract error</em></p>
                        `;
                return;
            }

            // Find matching custom errors
            const matchingErrors = errorSignatures.filter(
                (item) => item.signature === sig
            );

            // Generate results
            let resultHTML = `
                        <h3>Error Analysis</h3>
                        <p>Could not automatically parse: <code>${errorData}</code></p>
                    `;

            if (matchingErrors.length) {
                resultHTML += `
                            <h4>Possible Matching Custom Errors:</h4>
                            <ul>
                                ${matchingErrors
                                    .map(
                                        (err) => `
                                    <li><span class="error-match">${err.error}</span> (signature: ${err.signature})</li>
                                `
                                    )
                                    .join("")}
                            </ul>
                        `;
            } else {
                resultHTML += `<p>No exact matches found in the provided custom errors</p>`;
            }

            // Show all custom error signatures for reference
            resultHTML += `
                        <h4>All Custom Error Signatures:</h4>
                        <table>
                            <thead>
                                <tr>
                                    <th>Error Definition</th>
                                    <th>Signature (first 4 bytes)</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${errorSignatures
                                    .map(
                                        (err) => `
                                    <tr ${
                                        err.signature === sig
                                            ? 'class="error-match"'
                                            : ""
                                    }>
                                        <td>${err.error}</td>
                                        <td>${err.signature}</td>
                                    </tr>
                                `
                                    )
                                    .join("")}
                            </tbody>
                        </table>
                    `;

            resultDiv.innerHTML = resultHTML;
        }
    } catch (err) {
        resultDiv.innerHTML = `
                    <h3>Error Occurred</h3>
                    <p class="error-match">${err.message}</p>
                    <pre>${err.stack}</pre>
                    <p>Please check your custom error definitions are properly formatted.</p>
                `;
    }
}
