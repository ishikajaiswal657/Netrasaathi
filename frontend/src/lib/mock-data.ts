/**
 * Mock Data for Offline Development and Testing
 * Kept strictly isolated from production API client code.
 * Contains realistic study materials with diagrams, flowcharts, tables, graphs, and formulas.
 */

import { DocumentItem, ExplanationBlock, AuditLogItem, User } from './types';

export const MOCK_STUDENT_USER: User = {
  id: 1,
  email: 'student@netrasaathi.edu',
  role: 'student',
  created_at: '2026-10-25T10:00:00Z',
};

export const MOCK_ADMIN_USER: User = {
  id: 2,
  email: 'admin@netrasaathi.edu',
  role: 'admin',
  created_at: '2026-10-20T08:30:00Z',
};

export const MOCK_DOCUMENTS: DocumentItem[] = [
  {
    id: 'doc-101',
    user_id: 1,
    filename: 'Computer_Networks_OSI_Model.pdf',
    status: 'completed',
    page_count: 3,
    created_at: '2026-10-28T09:15:00Z',
    updated_at: '2026-10-28T09:17:30Z',
  },
  {
    id: 'doc-102',
    user_id: 1,
    filename: 'Data_Structures_Binary_Search_Tree.pdf',
    status: 'completed',
    page_count: 2,
    created_at: '2026-10-29T08:00:00Z',
    updated_at: '2026-10-29T08:03:00Z',
  },
  {
    id: 'doc-103',
    user_id: 1,
    filename: 'Operating_Systems_Process_Scheduling.png',
    status: 'processing',
    page_count: 1,
    created_at: '2026-10-29T10:45:00Z',
  },
  {
    id: 'doc-104',
    user_id: 1,
    filename: 'Cybersecurity_Public_Key_Cryptography.pdf',
    status: 'uploaded',
    page_count: 4,
    created_at: '2026-10-29T11:00:00Z',
  },
];

export const MOCK_PAGE_BLOCKS: Record<string, Record<number, ExplanationBlock[]>> = {
  'doc-101': {
    1: [
      {
        id: 'b-101-1-1',
        order_index: 1,
        block_type: 'diagram',
        title: 'OSI Reference Model Architecture',
        explanation_text:
          'This diagram shows a tall vertical stack of seven colored rectangular boxes representing the seven layers of computer networking. At the very top is Layer 7, the Application Layer, where web browsers and email apps run. Below it is Layer 6, Presentation, which handles data formatting and encryption. Next is Layer 5, Session, managing active connections. In the middle is Layer 4, Transport, which ensures reliable delivery using TCP or UDP. Below that is Layer 3, Network, which routes packets using IP addresses. Then Layer 2, Data Link, which uses MAC addresses on physical wires. At the very bottom is Layer 1, the Physical Layer, representing electrical cables, radio signals, and optical fibers. Thick two-way arrows connect each neighboring layer to show that data travels downwards when sending a message and upwards when receiving one.',
      },
      {
        id: 'b-101-1-2',
        order_index: 2,
        block_type: 'text',
        title: 'Data Encapsulation Concept',
        explanation_text:
          'When you send a message over the internet, each layer wraps your data with extra instructions called a header. Think of this like putting a letter inside an envelope, then inside a shipping pouch, and finally inside a mail truck. By the time it reaches the physical wire, your original data has all the routing tags needed to reach the destination safely.',
      },
      {
        id: 'b-101-1-3',
        order_index: 3,
        block_type: 'table',
        title: 'Comparison: Layer 2 Data Link vs Layer 4 Transport',
        explanation_text:
          'This table compares the Data Link layer and the Transport layer across three rows. Row one: Addressing. Data Link uses physical hardware MAC addresses that only matter on your local Wi-Fi or switch, while Transport uses port numbers to talk to specific programs like port 80 for web servers. Row two: Scope of delivery. Data Link moves data hop-by-hop between two directly connected devices, while Transport delivers end-to-end between the original sender and the final receiver. Row three: Common protocols. Data Link uses Ethernet and Wi-Fi standards, whereas Transport uses TCP for guaranteed delivery and UDP for fast video streaming.',
      },
    ],
    2: [
      {
        id: 'b-101-2-1',
        order_index: 1,
        block_type: 'flowchart',
        title: 'TCP Three-Way Handshake Connection Process',
        explanation_text:
          'This flowchart illustrates how two computers establish a reliable connection step by step using three diagonal arrows. Step one: The client computer on the left sends a message labeled SYN, meaning Synchronize, to initiate contact. Step two: The server on the right receives the SYN message and responds with a message labeled SYN-ACK, which confirms receipt and sends its own synchronize sequence number. Step three: The client sends an ACK message, meaning Acknowledgment, back to the server. Once this third message arrives, both computers are synchronized and safe communication begins.',
      },
      {
        id: 'b-101-2-2',
        order_index: 2,
        block_type: 'formula',
        title: 'Bandwidth-Delay Product Formula',
        explanation_text:
          'The formula on the page is written as B D P equals Bandwidth times Round Trip Time. In simple words, Bandwidth is how wide your internet pipe is, and Round Trip Time is how many milliseconds a signal takes to travel to the destination and back. Multiplying these two numbers tells you the maximum number of bits that can be in flight across the network wire at any single second.',
      },
    ],
    3: [
      {
        id: 'b-101-3-1',
        order_index: 1,
        block_type: 'graph',
        title: 'TCP Throughput vs Packet Loss Rate',
        explanation_text:
          'This is a line graph showing how network speed drops as packets are lost. The horizontal axis along the bottom measures packet loss from 0 percent up to 10 percent. The vertical axis on the left measures throughput in Megabits per second, going from 0 up to 100. The curve starts at its highest point of 98 Megabits per second when packet loss is 0. As soon as loss rises to just 2 percent, the line falls steeply down to 35 Megabits. Beyond 5 percent loss, throughput flattens near the lowest value of 8 Megabits per second, demonstrating that TCP drastically slows down even with tiny amounts of packet loss.',
      },
    ],
  },
  'doc-102': {
    1: [
      {
        id: 'b-102-1-1',
        order_index: 1,
        block_type: 'diagram',
        title: 'Binary Search Tree Structure',
        explanation_text:
          'This diagram shows a tree structure with round circles called nodes connected by lines called branches. At the top is the root node containing the number 50. Two branches extend downward from it. The left branch leads to node 30, and the right branch leads to node 70. Every node to the left is smaller than its parent, and every node to the right is larger. For example, node 30 has a left child with 20 and a right child with 40. This rule allows search algorithms to cut half the remaining choices at each step.',
      },
      {
        id: 'b-102-1-2',
        order_index: 2,
        block_type: 'formula',
        title: 'Average Search Time Complexity',
        explanation_text:
          'The formula says Big O of log base 2 of N. In plain terms, if you have one thousand items stored in a balanced binary search tree, finding any item takes only about ten comparisons because the tree divides the search space in half each time.',
      },
    ],
    2: [
      {
        id: 'b-102-2-1',
        order_index: 1,
        block_type: 'flowchart',
        title: 'Node Insertion Algorithm',
        explanation_text:
          'This flowchart guides you through adding a new value into a binary tree. It starts at the top: Start at the Root. The first decision diamond asks: Is the new value less than the current node? If yes, move left. If no, move right. The next decision asks: Is this child empty? If yes, insert the new node here and stop. If not empty, repeat the comparison with the child node.',
      },
    ],
  },
};

export const MOCK_AUDIT_LOGS: AuditLogItem[] = [
  {
    id: 1,
    user_id: 1,
    user_email: 'student@netrasaathi.edu',
    action: 'upload',
    document_id: 'doc-104',
    ip_address: '127.0.0.1',
    created_at: '2026-10-29T11:00:15Z',
  },
  {
    id: 2,
    user_id: 1,
    user_email: 'student@netrasaathi.edu',
    action: 'process',
    document_id: 'doc-103',
    ip_address: '127.0.0.1',
    created_at: '2026-10-29T10:45:20Z',
  },
  {
    id: 3,
    user_id: 1,
    user_email: 'student@netrasaathi.edu',
    action: 'view',
    document_id: 'doc-101',
    ip_address: '127.0.0.1',
    created_at: '2026-10-29T09:20:00Z',
  },
  {
    id: 4,
    user_id: 1,
    user_email: 'student@netrasaathi.edu',
    action: 'ask',
    document_id: 'doc-101',
    ip_address: '127.0.0.1',
    created_at: '2026-10-29T09:22:45Z',
  },
  {
    id: 5,
    user_id: 2,
    user_email: 'admin@netrasaathi.edu',
    action: 'view_audit_logs',
    document_id: null,
    ip_address: '127.0.0.1',
    created_at: '2026-10-29T09:30:00Z',
  },
];
