import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Scanner;

/**
 * Represents a book in the library system.
 */
class Book {
    private int id;
    private String title;
    private String author;
    private boolean isIssued;

    /**
     * Initializes a new Book instance.
     *
     * @param id The unique ID of the book.
     * @param title The title of the book.
     * @param author The author of the book.
     */
    public Book(int id, String title, String author) {
        this.id = id;
        this.title = title;
        this.author = author;
        this.isIssued = false;
    }

    // Getters
    public int getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public String getAuthor() {
        return author;
    }

    /**
     * Checks if the book is currently issued.
     * @return true if the book is issued, false otherwise.
     */
    public boolean isIssued() {
        return isIssued;
    }

    /**
     * Marks the book as issued.
     */
    public void issue() {
        this.isIssued = true;
    }

    /**
     * Marks the book as returned (available).
     */
    public void returned() {
        this.isIssued = false;
    }

    /**
     * Returns a string representation of the Book object.
     */
    @Override
    public String toString() {
        String status = isIssued ? "Issued" : "Available";
        return String.format("Book ID: %d, Title: %s, Author: %s, Status: %s",
                             id, title, author, status);
    }
}

/**
 * Represents a user registered in the library system.
 */
class User {
    private int userId;
    private String name;
    private List<Integer> borrowedBooks; // Stores a list of book IDs borrowed by the user

    /**
     * Initializes a new User instance.
     *
     * @param userId The unique ID of the user.
     * @param name The name of the user.
     */
    public User(int userId, String name) {
        this.userId = userId;
        this.name = name;
        this.borrowedBooks = new ArrayList<>();
    }

    // Getters
    public int getUserId() {
        return userId;
    }

    public String getName() {
        return name;
    }

    /**
     * Adds a book ID to the user's list of borrowed books.
     * @param bookId The ID of the book to add.
     */
    public void borrowBook(int bookId) {
        this.borrowedBooks.add(bookId);
    }

    /**
     * Removes a book ID from the user's list of borrowed books.
     * @param bookId The ID of the book to remove.
     */
    public void returnBook(int bookId) {
        // Remove by object value to avoid interpretation as index
        this.borrowedBooks.remove(Integer.valueOf(bookId));
    }

    /**
     * Checks if the user has borrowed a specific book.
     * @param bookId The ID of the book to check.
     * @return true if the user has borrowed the book, false otherwise.
     */
    public boolean hasBorrowedBook(int bookId) {
        return this.borrowedBooks.contains(bookId);
    }

    /**
     * Returns a string representation of the User object.
     */
    @Override
    public String toString() {
        return String.format("User ID: %d, Name: %s, Borrowed Books: %s",
                             userId, name, borrowedBooks.toString());
    }
}

/**
 * Manages the collection of books and users, and handles operations like issuing and returning books.
 */
class Library {
    private Map<Integer, Book> books; // Map to store Book objects, keyed by book ID
    private Map<Integer, User> users; // Map to store User objects, keyed by user ID

    /**
     * Initializes the Library with empty collections of books and users.
     */
    public Library() {
        this.books = new HashMap<>();
        this.users = new HashMap<>();
    }

    /**
     * Adds a new book to the library.
     *
     * @param book The Book object to add.
     */
    public void addBook(Book book) {
        if (books.containsKey(book.getId())) {
            System.out.println("Error: Book with ID " + book.getId() + " already exists.");
            return;
        }
        books.put(book.getId(), book);
        System.out.println("Book '" + book.getTitle() + "' added successfully.");
    }

    /**
     * Registers a new user in the library.
     *
     * @param user The User object to add.
     */
    public void addUser(User user) {
        if (users.containsKey(user.getUserId())) {
            System.out.println("Error: User with ID " + user.getUserId() + " already exists.");
            return;
        }
        users.put(user.getUserId(), user);
        System.out.println("User '" + user.getName() + "' registered successfully.");
    }

    /**
     * Issues a book to a user.
     *
     * @param bookId The ID of the book to issue.
     * @param userId The ID of the user borrowing the book.
     */
    public void issueBook(int bookId, int userId) {
        Book book = books.get(bookId);
        User user = users.get(userId);

        if (book == null) {
            System.out.println("Book not found.");
            return;
        }

        if (user == null) {
            System.out.println("User not found.");
            return;
        }

        if (book.isIssued()) {
            System.out.println("Book is already issued.");
            return;
        }

        book.issue();
        user.borrowBook(bookId);
        System.out.println("Book issued successfully.");
    }

    /**
     * Registers a book as returned by a user.
     *
     * @param bookId The ID of the book to return.
     * @param userId The ID of the user returning the book.
     */
    public void returnBook(int bookId, int userId) {
        Book book = books.get(bookId);
        User user = users.get(userId);

        if (book == null || user == null) {
            System.out.println("Invalid book or user.");
            return;
        }

        if (!user.hasBorrowedBook(bookId)) {
            System.out.println("Error: Book ID " + bookId + " was not borrowed by User ID " + userId + ".");
            return;
        }

        if (!book.isIssued()) {
            System.out.println("Warning: Book was not marked as issued, but is being returned.");
        }

        book.returned();
        user.returnBook(bookId);
        System.out.println("Book returned successfully.");
    }

    /**
     * Displays details of all books in the library.
     */
    public void showBooks() {
        if (books.isEmpty()) {
            System.out.println("No books available.");
            return;
        }
        for (Book book : books.values()) {
            System.out.println(book);
        }
    }

    /**
     * Displays details of all registered users.
     */
    public void showUsers() {
        if (users.isEmpty()) {
            System.out.println("No users registered.");
            return;
        }
        for (User user : users.values()) {
            System.out.println(user);
        }
    }
}

/**
 * Main class to run the library management system console interface.
 */
public class LibrarySystem {
    public static void main(String[] args) {
        Library library = new Library();
        Scanner scanner = new Scanner(System.in); // Scanner for reading console input

        while (true) {
            System.out.println("\n--- Library Menu ---");
            System.out.println("1. Add Book");
            System.out.println("2. Add User");
            System.out.println("3. Issue Book");
            System.out.println("4. Return Book");
            System.out.println("5. View Books");
            System.out.println("6. View Users");
            System.out.println("0. Exit");
            System.out.print("Choose option: ");

            String choiceStr = scanner.nextLine();
            int choice;

            try {
                choice = Integer.parseInt(choiceStr);
            } catch (NumberFormatException e) {
                System.out.println("Invalid input. Please enter a number.");
                continue;
            }

            switch (choice) {
                case 1:
                    try {
                        System.out.print("Enter Book ID: ");
                        int bookId = Integer.parseInt(scanner.nextLine());
                        System.out.print("Enter Title: ");
                        String title = scanner.nextLine();
                        System.out.print("Enter Author: ");
                        String author = scanner.nextLine();
                        library.addBook(new Book(bookId, title, author));
                    } catch (NumberFormatException e) {
                        System.out.println("Invalid input for Book ID. Please enter an integer.");
                    }
                    break;
                case 2:
                    try {
                        System.out.print("Enter User ID: ");
                        int userId = Integer.parseInt(scanner.nextLine());
                        System.out.print("Enter Name: ");
                        String name = scanner.nextLine();
                        library.addUser(new User(userId, name));
                    } catch (NumberFormatException e) {
                        System.out.println("Invalid input for User ID. Please enter an integer.");
                    }
                    break;
                case 3:
                    try {
                        System.out.print("Enter Book ID to issue: ");
                        int issueBookId = Integer.parseInt(scanner.nextLine());
                        System.out.print("Enter User ID to issue to: ");
                        int issueUserId = Integer.parseInt(scanner.nextLine());
                        library.issueBook(issueBookId, issueUserId);
                    } catch (NumberFormatException e) {
                        System.out.println("Invalid input. Please enter integers for IDs.");
                    }
                    break;
                case 4:
                    try {
                        System.out.print("Enter Book ID to return: ");
                        int returnBookId = Integer.parseInt(scanner.nextLine());
                        System.out.print("Enter User ID returning: ");
                        int returnUserId = Integer.parseInt(scanner.nextLine());
                        library.returnBook(returnBookId, returnUserId);
                    } catch (NumberFormatException e) {
                        System.out.println("Invalid input. Please enter integers for IDs.");
                    }
                    break;
                case 5:
                    library.showBooks();
                    break;
                case 6:
                    library.showUsers();
                    break;
                case 0:
                    System.out.println("Exiting...");
                    scanner.close(); // Close the scanner to release system resources
                    return;
                default:
                    System.out.println("Invalid choice. Please choose a valid option.");
                    break;
            }
        }
    }
}