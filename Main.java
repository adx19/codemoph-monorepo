public class Main {

    public static int add(int a, int b) {
        return a + b;
    }

    public static void main(String[] args) {
        System.out.println("=== CodeMorph Application Test Started ===");

        int input_a = 10;
        int input_b = 20;

        int result = add(input_a, input_b);

        if (result == 30) {
            System.out.println("✅ Test Passed: add()");
        } else {
            System.out.println("❌ Test Failed: add()");
        }

        System.out.println("=== Test Completed ===");
    }
}