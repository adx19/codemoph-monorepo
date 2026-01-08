public class test {

    public static void main(String[] args) {
        System.out.println("=== CodeMorph Application Test Started ===");

        // Arrange
        int inputA = 10;
        int inputB = 20;

        // Act
        int result = add(inputA, inputB);

        // Assert
        if (result == 30) {
            System.out.println("✅ Test Passed: add()");
        } else {
            System.out.println("❌ Test Failed: add()");
        }

        System.out.println("=== Test Completed ===");
    }

    // Sample method under test
    private static int add(int a, int b) {
        return a + b;
    }
}
